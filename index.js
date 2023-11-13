
globe_bin_colors = [
  "#d8f3dc",
  "#b7e4c7",
  "#95d5b2",
  "#74c69d",
  "#52b788",
  "#40916c",
  "#2d6a4f",
  "#1b4332",
  "#081c15",
];

globe_bin_ranges = [
  { st: 0, end: 300 },
  { st: 301, end: 700 },
  { st: 701, end: 1200 },
  { st: 1201, end: 2000 },
  { st: 2001, end: 3500 },
  { st: 3501, end: 6000 },
  { st: 6001, end: 9000 },
  { st: 9001, end: 13000 },
  { st: 13001, end: 20000 },
];

function getCol_bin(num) {
  // for (i = 0; i < globe_bin_colors.length; i++) {
  //   // if (num >= globe_bin_ranges[i].st && num <= globe_bin_ranges[i].end) {
  //     return globe_bin_colors[i];
  //   // }
  // }
  return "#000";
}

function loadGlobe() {
  init_y = 0;
  // for (i = 0; i < globe_bin_colors.length; i++) {
  //   d3.select("#color-scale")
  //     .append("rect")
  //     .attr("x", 0)
  //     .attr("y", init_y)
  //     .attr("height", "55")
  //     .attr("width", "20")
  //     .style("fill", globe_bin_colors[i]);

  //   d3.select("#color-scale")
  //     .append("text")
  //     .attr("x", 25)
  //     .attr("y", init_y + 32.5)
  //     .text(`${globe_bin_ranges[i].st} - ${globe_bin_ranges[i].end}`)
  //     .style("fill", globe_bin_colors[i]);
  //   init_y += 55;
  // }

  let max_num = 0,
    min_num = 10000000;
  let country = null;
  for (let data of Object.keys(country_data)) {
    if (data == "undefined") continue;
    let total = 0;
    for (let x of Object.keys(country_data[data]))
      total += Number(country_data[data][x]);
    country_data[data]["sum"] = total;
    if (total > max_num) {
      country = data;
    }
    max_num = Math.max(max_num, total);
    min_num = Math.min(min_num, total);
  }
  // console.log(max_num, min_num, country);
  let r_max = 216,
    g_max = 243,
    b_max = 220;
  let r_min = 8,
    g_min = 28,
    b_min = 21;

  // function getColor(col, c_min, c_max) {
  //   if (max_num === min_num) return 0;
  //   max = max_num;
  //   min = min_num;
  //   var a = (1 / c_max - 1 / c_min) / (min - max);
  //   var b = 1 / c_max - a * min;
  //   return Math.floor(1 / (a * col + b));
  // }

  // ms to wait after dragging before auto-rotating
  var rotationDelay = 10000;
  // scale of the globe (not the canvas element)
  var scaleFactor = 0.9;
  // autorotation speed
  var degPerSec = 6;
  // start angles
  var angles = { x: -10, y: 40, z: 0 };
  // colors
  var colorWater = "#48cae9";
  var colorLand = "#4b4b4b";
  var colorGraticule = "#48cae4";
  var colorCountry = "#ff0004";
  var countryMap = {};

  function findCaseIns(name) {
    for (const country in country_list) {
      if (country.toLowerCase() === name.toLowerCase())
        return country_data[country];
    }
    return undefined;
  }

  function enter(country) {
    var country = countryList.find(function (c) {
      return parseInt(c.id, 10) === parseInt(country.id, 10);
    });
    // console.log(country_data[country.name]);
    // console.log(country)
    function showData(data) {
      // console.log(data)
      if (data) {
        // let total = data["sum"];
        // for (let x of Object.keys(data)) total += Number(data[x]);
        // console.log(total);
        const infor = [
          "About"
        ];
        let str = `<h1>${country.name}</h1>`;
        for (const info of infor) {
          if (data[info])
            str += `<text>${info}</text> : ${data[info]}<br/>`;
        }
        current
          // .style("left", event.pageX + 10)
          // .style("top", event.pageY - 15)
          .style("padding", "10px")
          .html(str);
      } else {
        current
          .style("padding", "10px")
          .html(`<h1>${country.name}</h1>No Data`);
      }
    }
    if (country_data[country.name]) {
      showData(country_data[country.name]);
    } else {
      let tem_data = findCaseIns(country.name);
      if (tem_data) {
        showData(country_data[country.name]);
      } else {
        showData(undefined);
      }
    }
  }

  function leave(country) {
    current.style("padding", "0px").html("");
  }

  var current = d3.select("#current");
  var current2 = d3.select("#current2")
  var canvas = d3.select("#globe");
  var context = canvas.node().getContext("2d");
  var water = { type: "Sphere" };
  var projection = d3.geoOrthographic().precision(0.1);
  var graticule = d3.geoGraticule10();
  var path = d3.geoPath(projection).context(context);
  var v0; // Mouse position in Cartesian coordinates at start of drag gesture.
  var r0; // Projection rotation as Euler angles at start.
  var q0; // Projection rotation as versor at start.
  var lastTime = d3.now();
  var degPerMs = degPerSec / 1000;
  var width, height;
  var land, countries;
  var countryList;
  var autorotate, now, diff, roation;
  var currentCountry;

  //
  // Functions
  //

  function setAngles() {
    var rotation = projection.rotate();
    rotation[0] = angles.y;
    rotation[1] = angles.x;
    rotation[2] = angles.z;
    projection.rotate(rotation);
  }

  function scale() {
    width = document.documentElement.clientWidth * 0.4;
    height = document.documentElement.clientHeight * 0.9;

    canvas.attr("width", width).attr("height", height);
    projection
      .scale((scaleFactor * Math.min(width, height)) / 2)
      .translate([width / 2, height / 2]);
    render();
  }

  function startRotation(delay) {
    autorotate.restart(rotate, delay || 0);
  }

  function stopRotation() {
    autorotate.stop();
  }

  function dragstarted() {
    v0 = versor.cartesian(projection.invert(d3.mouse(this)));
    r0 = projection.rotate();
    q0 = versor(r0);
    stopRotation();
  }

  function dragged() {
    var v1 = versor.cartesian(projection.rotate(r0).invert(d3.mouse(this)));
    var q1 = versor.multiply(q0, versor.delta(v0, v1));
    var r1 = versor.rotation(q1);
    projection.rotate(r1);
    render();
  }

  function dragended() {
    startRotation(rotationDelay);
  }

  function render() {
    context.clearRect(0, 0, width, height);
    fill(water, colorWater);
    stroke(graticule, colorGraticule);

    for (x of countries.features) {
      let id = Number(x.id);
      // console.log(country_data[countryMap[id]]);
      if (country_data[countryMap[id]]) {
        // fill(x, `${getCol_bin(country_data[countryMap[id]]["sum"])}`);
        fill(x, "#2d6a4f")
      } else {
        // console.log("no dtaa");
        fill(
          x,
          `rgb(${225},
            ${225},
            ${225})`
        );
      }
    }
    if (currentCountry) {
      // alert(JSON.stringify(currentCountry));
      fill(currentCountry, colorCountry);
    }
  }

  function fill(obj, color) {
    context.beginPath();
    path(obj);
    context.fillStyle = color;
    context.fill();
  }

  function stroke(obj, color) {
    context.beginPath();
    path(obj);
    context.strokeStyle = color;
    context.stroke();
  }

  function rotate(elapsed) {
    now = d3.now();
    diff = now - lastTime;
    if (diff < elapsed) {
      rotation = projection.rotate();
      rotation[0] += diff * degPerMs;
      projection.rotate(rotation);
      render();
    }
    lastTime = now;
  }

  function loadData(cb) {
    d3.json(
      "https://unpkg.com/world-atlas@1/world/110m.json",
      function (error, world) {
        if (error) throw error;
        // d3.tsv(
        //   "https://gist.githubusercontent.com/mbostock/4090846/raw/07e73f3c2d21558489604a0bc434b3a5cf41a867/world-country-names.tsv",
        //   function (error, countries) {
        //     if (error) throw error;
        cb(world, countries);
        // }  
        // );
      }
    );
  }

  // https://github.com/d3/d3-polygon
  function polygonContains(polygon, point) {
    var n = polygon.length;
    var p = polygon[n - 1];
    var x = point[0],
      y = point[1];
    var x0 = p[0],
      y0 = p[1];
    var x1, y1;
    var inside = false;
    for (var i = 0; i < n; ++i) {
      (p = polygon[i]), (x1 = p[0]), (y1 = p[1]);
      if (y1 > y !== y0 > y && x < ((x0 - x1) * (y - y1)) / (y0 - y1) + x1)
        inside = !inside;
      (x0 = x1), (y0 = y1);
    }
    return inside;
  }

  function mousemove() {
    var c = getCountry(this);
    if (!c) {
      if (currentCountry) {
        leave(currentCountry);
        currentCountry = undefined;
        render();
      }
      return;
    }
    if (c === currentCountry) {
      return;
    }
    currentCountry = c;
    render();
    enter(c);
  }

  function zoomCo(element) {
    const currentWidth = element.clientWidth;
    const currentHeight = element.clientHeight;
    const newWidth = currentWidth * 1.1;
    const newHeight = currentHeight * 1.1;
    element.style.width = newWidth + "px";
    element.style.height = newHeight + "px";
  }

  function handleClick() {
    var c = getCountry(this);
    // zoomCo(this) // for zooming in the screen
    if (!c) {
      if (currentCountry) {
        leave(currentCountry);
        currentCountry = undefined;
        render();
      }
      return;
    }
    if (c === currentCountry) {
      var country = countryList.find(function (co) {
        return parseInt(co.id, 10) === parseInt(c.id, 10)
      });
      // console.log(country)
      // here will be the code for the box we have to make
      let str = `<h1>${country.name}</h1>`;
      if (country.id == 624){        // Guinea-Bissau
        str += `<div><p>${"Guinea-Bissau, one of the world's poorest and most fragile countries, has a population of about 1.9 million.Guinea-Bissau has a history of political and institutional fragility dating back to its independence from Portugal in 1974."}</p><br/><ol><li>${"2015 - 67%"}</li><li>${"2017 - 66.8%"}</li><li>${"2018 - 64.4%"}</li><li>${"2019 - 63.8%"}</li><li>${"2020 - 66.2% (COVID)"}</li><li>${"2021 - 64.4%"}</li><li>${"2022 - 66.9% (due to weaker growth in per captia GDP)"}</li></ol></div>`
        str += `<div><h3>${"World Bank Engagement in Guinea-Bissau"}</h1><br/>
        <p>${"The World Bank Group engagement in Guinea-Bissau is guided by a Country Partnership Framework (CPF) reassessed through PLR approved in July 2021, and that extended the CPF period from FY 21 to FY 23. The revised CPF (FY18-23) has two focus areas:"}</p>
        <br/>
        <ol><li>${"Expand economic opportunities and enhance resilience; and"}</li>
        <li>${"Bolster human capital through improved education, health and social protection."}</li></ol>

        <p>${"The most recent Systematic Country Diagnostic identified several interconnected binding constraints to sustainably reducing poverty and increasing shared prosperity, including:"}</p>
        <ul><li>${"Lack of inclusiveness and low rural productivity."}</li>
        <li>${"Low and unstable economic growth."}</li>
        <li>${"Fragility and weak governance."}</li></ul>

        <h4>${'Exploitation'}</h4><br/>
        <p>${'Traffickers exploit Bissau-Guinean girls in domestic servitude and in sex trafficking in bars, nightclubs, and hotels in Bissau. Women in commercial sex and children in the Bijagos, an archipelago largely devoid of government and law enforcement presence, are vulnerable to sex trafficking.'}</p><br/>
        <h4>${'Dumping'}</h4><br/>
        <p>${'Landfills: These are controlled areas designated for the disposal of solid waste. Landfills are designed to minimize environmental impacts, and modern landfills include measures to prevent contamination of soil and groundwater. However, in many developing countries, including Guinea-Bissau, some landfills may not meet international standards, leading to environmental and health concerns.'}</p><br/>
        <p>${'Open Dumps: In some areas, especially in rural and less developed regions, open dumps may exist. These are informal and unregulated dumping sites where waste is disposed of without proper management or environmental safeguards. Open dumps can lead to pollution and health hazards.'}</p>
        <p>${"Dumping in Water Bodies: In some cases, waste may be dumped directly into rivers, streams, or other water bodies, which can lead to water pollution and harm aquatic ecosystems."}</p>
        <p>${"Illegal Dumping: Unfortunately, illegal dumping can occur in many areas where waste is discarded in unauthorized locations, such as empty lots, roadsides, or natural areas."}</p>
        
        <h4>${'Results'}</h4>
        <h5>${"West Africa Regional Communications Infrastructure Project - SOP3"}</h5>
        <li>${"The volume of international traffic has more than tripled: from 5,62 to 17,13 kbps per number of subscribers."}</li>
        <li>${"Access to internet services has more than doubled: from 17% to 42%."}</li>
        <li>${"Access to telephone services (fixed and cellular) has significantly improved: from 83% to 94%."}</li>
        
        <h5>${"Emergency Water and Electricity Services Upgrading Project"}</h5>
        <li>${"76,768 people in urban areas (Bissau) provided with access to improved water sources."}</li>
        <li>${"208,000 people benefiting in Bissau from enhanced electricity services."}</li>
        <li>${"A reliable bulk electricity supply for Bissau with KARPOWER (17 MW) is set up since February 2018 and has been recently re-negotiated by EAGB/MNRE for an increase of power availability from 17 to 24 MW."}</li>
        <li>${"Reform of the water and electricity public utility (EAGB) through the service contract (EdP/AdP) has resumed work on July 1st, 2021, after COVID 19 disruptions."}</li>

        <h5>${"Safety Nets and Basic Services Project"}</h5>
        <li>${"5,239 households (about 50,000 individuals) have benefitted from at least one quarterly cash transfer."}</li>
        <li>${"37,292 people have access to improved water source."}</li>
        <li>${"30,240 individuals have been provided access to an all-season road."}</li>

        <h5>${"Guinea Bissau Food Security Emergency Project (PUSA)"}</h5>
        <li>${"72 metric tons of improved seeds varieties, 90 metric tons of fertilizers and small machinery distributed to over 7200 farmers (75 percent women) to support vulnerable households to increase food production during the off-season."}</li>
        <li>${"520 metric tons of improved seeds varieties and 400 metric tons of fertilizers procured and distributed to farmers during the rainy season."}</li>
        
        <h5>${"Guinea-Bissau - Rural Transport Project"}</h5>
        <p>${"Civil works just started in August 2021 and expected results are:"}</p>
        <li>${"30,000 individuals will be provided access to an all-season road."}</li>
        <li>${"Access to 5 markets and to 29 schools and health centers will be improved."}</li>
        
        <h4>${"References"}</h4>
        <a href="https://databankfiles.worldbank.org/public/ddpext_download/poverty/987B9C90-CB9F-4D93-AE8C-750588BF00QA/AM2020/Global_POVEQ_GNB.pdf">World Bank Country Profile for Guinea-Bissau </a>
        </br>
        <a href="https://hdr.undp.org/sites/default/files/Country-Profiles/MPI/GNB.pdf">UNDP Country Profile for Guinea-Bissau </a>
        
        </div>`
      }
      else if (country.id == 694){   // Sierra Leone
        str += `<div>
        <h4>${"Poverty Ratio"}</h4>
        <li>${"2015 - 68.3%"}</li>
        <li>${"2017 - 64.8%"}</li>
        <li>${"2018 - 49.9%"}</li>
        <li>${"2019 - 40.6%"}</li>
        <li>${"2020 - 44.2% (COVID)"}</li>
        <li>${"2021 - 59.2%"}</li>
        </br>

        <p>${"<b>Poverty:</b> Based on these estimates, 59.2 percent of the population in Sierra Leone (4,987 thousand people in 2021) is multidimensionally poor while an additional 21.3 percent is classified as vulnerable to multidimensional poverty (1,790 thousand people in 2021)."}</p>
        <p>${"<b>Reason:</b> Experts believe that four primary factors contribute to Sierra Leone's overwhelming levels of poverty: government corruption, a lack of an established education system, absence of civil rights and poor infrastructure."}</p>

        <br/>
        <h3>${"World Bank Engagement in Sierra Leone"}</h3><br/><h2>${"Helping Women Farmers:"}</h2><br/>
        <ol><li>${"The Smallholder Commercialization and Agribusiness Development Project (SCADeP) has helped beneficiaries improve household incomes, asset ownership, and food security."}</li><li>${"54,392 women out of 125,681 beneficiaries (43%) have benefited from the project."}</li><li>${"Over a hundred children have completed primary, secondary, and university education thanks to a benefit-sharing scheme."}</li></ol>
        <h3>${"Clean Energy Generation:(31 / Jan / 2023)"}</h3><br/>
        <p>${"West Africa has one of the lowest electrification rates, with 220 million people living without access, coupled with some of the highest electricity costs in Sub-Saharan Africa. Rising oil prices – as a consequence of the war in Ukraine – have increased the liabilities of electricity utilities, and countries are facing an acute power supply crisis that threatens their economic growth. Furthermore, countries in the region rely on oil-based power plants to meet growing demand. In addition to the negative impact on the climate, this leads to increasingly higher tariffs for consumers."}</p><br/>
        <p>${"As part of the launch, a Regional Energy Sector Roundtable was held prior to the Signing Ceremony to specifically discuss how deployment of renewable energy can help countries lower costs, reduce emissions, and ensure universal energy access to support economic transformation in West Africa."}</p>
        <h3>${"Leveraging Urbanization Forces"}</h3><br/>
        <ol><li>${"The new poverty assessment for Sierra Leone says the country faces many challenges in improving the welfare of citizens, but that urbanization offers an opportunity to improve living standards and reduce poverty among the population."}</li><li>${"The analysis offers several recommendations including the need to invest in secondary cities, which could have considerable effect on poverty reduction and economic growth."}</li><li>${"The report also provides several reform priorities for government consideration, including increased investment in education provision and quality to help citizens access more formal opportunities, thus enabling firms to expand and demand more skilled employees."}</li></ol><br/>
        <p>${"Sierra Leone, like many countries, may have various types of dumping sites for waste disposal. These sites can range from controlled and regulated facilities to informal and unregulated locations. Common types of dumping sites in Sierra Leone may include:"}</p><br/>
        <b>${"Landfills:"}</b><p>${" Landfills are controlled areas designated for the disposal of solid waste. They are designed to minimize environmental impacts and often have measures in place to prevent contamination of soil and groundwater. However, in some cases, landfills may not meet international standards, and their management can vary."}</p><br/>
        <b>${"Open Dumps:"}</b><p>${"In less developed or rural areas, open dumps may exist. These are informal and unregulated dumping sites where waste is disposed of without proper management or environmental safeguards. Open dumps can lead to environmental pollution and health hazards."}</p><br/>
        <b>${"Illegal Dumping:"}</b><p>${"Illegal dumping can occur when waste is disposed of in unauthorized locations, such as empty lots, roadsides, or natural areas. This practice can have serious environmental and health consequences."}</p><br/>
        <b>${"Dumping in Water Bodies:"}</b><p>${"Unfortunately, in some areas, waste may be dumped directly into rivers, streams, or other water bodies, leading to water pollution and harm to aquatic ecosystems."}</p>
        <br/>
        <b>${"Improvised Landfills:"}</b><p>${"In some cases, communities may establish improvised landfill sites that are not formally regulated but are used for waste disposal. These sites may lack proper infrastructure and waste management practices."}</p>

        <h4>${"Pressing Issues"}</h4>
        <p>${"Sierra Leone, like many countries, may have various types of dumping sites for waste disposal. These sites can range from controlled and regulated facilities to informal and unregulated locations. Common types of dumping sites in Sierra Leone may include:"}</<p>
        <p>${"<b>Landfills:</b> Landfills are controlled areas designated for the disposal of solid waste. They are designed to minimize environmental impacts and often have measures in place to prevent contamination of soil and groundwater. However, in some cases, landfills may not meet international standards, and their management can vary."}</<p>
        <p>${"<b>Open Dumps:</b> In less developed or rural areas, open dumps may exist. These are informal and unregulated dumping sites where waste is disposed of without proper management or environmental safeguards. Open dumps can lead to environmental pollution and health hazards."}</<p>
        <p>${"<b>Illegal Dumping:</b> Illegal dumping can occur when waste is disposed of in unauthorized locations, such as empty lots, roadsides, or natural areas. This practice can have serious environmental and health consequences."}</<p>
        <p>${"<b>Dumping in Water Bodies:</b> Unfortunately, in some areas, waste may be dumped directly into rivers, streams, or other water bodies, leading to water pollution and harm to aquatic ecosystems."}</<p>
        <p>${"<b>Improvised Landfills:</b> In some cases, communities may establish improvised landfill sites that are not formally regulated but are used for waste disposal. These sites may lack proper infrastructure and waste management practices."}</<p>

        <h4>${"References"}</h4>
        <a href="https://databankfiles.worldbank.org/public/ddpext_download/poverty/987B9C90-CB9F-4D93-AE8C-750588BF00QA/SM2020/Global_POVEQ_SLE.pdf" target="_blank">Poverty & Equity Brief of Sierra Leone by World Bank </a>
        </br>
        <a href="https://hdr.undp.org/sites/default/files/Country-Profiles/MPI/SLE.pdf" target="_blank">Briefing note for Sierra Leone on the 2023 Multidimensional Poverty Index by UNDP</a>
        
        <h4>${"Poverty Comparision Images"}</h4>
        <img src="./Images/SierraLeone1.png" alt="Change in Poverty in Sierra Leone in every 5 years" width="80%" > 
        <p>Change in Poverty in Sierra Leone in every 5 years</p>
        <img src="./Images/SierraLeone2.png" alt="Poverty Ratio in Sierra Leone under $5.50 per day" width="80%"> 
        <p>Poverty Ratio in Sierra Leone under $5.50 per day</p>
        <img src="./Images/SierraLeone3.png" alt="Poverty Headcount Rate in Sierra Leone" width="80%"> 
        <p>Poverty Headcount Rate in Sierra Leone</p>
        </div>`
      }
      else if (country.id == 430){   // Liberia
        str += `<div>
        <h4>${"Poverty Ratio"}</h4>
        <li>${"2016 - 50.9%"}</li>
        <li>${"2018 - 53.2%"}</li>
        <li>${"2019 - 44.4%"}</li>
        <li>${"2020 - 46.3% (COVID)"}</li>
        <li>${"2021 - 51%"}</li>
        <li>${"2022 - 44%"}</li>
        </br>

        <p>${"<b>Poverty:</b> Based on these estimates, 52.3 percent of the population in Liberia (2,717 thousand people in 2021) is multidimensionally poor while an additional 23.3 percent is classified as vulnerable to multidimensional poverty (1,211 thousand people in 2021)."}</p>
        <p>${"<b>Reason:</b> In addition, 44 percent of the population lived under the extreme international poverty line of $1.90 per day. Poverty in Liberia is projected to increase over the next few years, driven by increasing food prices, lower commodity prices for minerals, and the ongoing COVID-19 pandemic."}</p>

        <h4>${"References"}</h4>
        <a href="https://databankfiles.worldbank.org/public/ddpext_download/poverty/987B9C90-CB9F-4D93-AE8C-750588BF00QA/current/Global_POVEQ_LBR.pdf" target="_blank">Poverty & Equity Brief of Liberia by World Bank </a>
        </br>
        <a href="https://hdr.undp.org/sites/default/files/Country-Profiles/MPI/LBR.pdf" target="_blank">Multidimensional Poverty Index 2023 by UNDP </a>
        </br>
        <a href="https://www.elibrary.imf.org/view/journals/002/2022/296/article-A001-en.xml#:~:text=of%205.2%20million.-,Per%2Dcapita%20income%20is%20about%20a%20third%20of%20the%20level,of%2051%20percent%20in%202021." target="_blank">IMF Report on Liberia </a>
        
        <h4>${"Poverty Comparision Images"}</h4>
        <img src="./Images/LIBERIA1.png" alt="Poverty Headcount Rate in Liberia" width="80%">
        <p>Poverty Headcount Rate in Liberia</p>
        </div>`
      }
      else if (country.id == 768){   // Togo
        str += `<div>
        <h4>${"Poverty Ratio"}</h4>
        <li>${"2015 - 55.1%"}</li>
        <li>${"2017 - 53.5%"}</li>
        <li>${"201 - 53.6%"}</li>
        <li>${"2020 - 81.2% (COVID)"}</li>
        <li>${"2022 - 49.2%"}</li>
        </br>

        <p>${"<b>Poverty:</b> Togo is classified as a Least Developed Country (LCD) and Low Income Food Deficit Country (LIFDC), and remains among the poorest countries in sub-Saharan Africa. Over 50 percent of the population live below the poverty line (under USD 1, 25 per day)"}</p>
        <p>${"<b>Reason:</b> It lies between Ghana and Benin and has a population of 7.6 million. Almost 7 out of 10 people in Togo live on less than $2 a day, making it one of the world's poorest countries. One of the problems that has plagued Togo in the past is inadequate education, which contributes to the country's poverty."}</p>

        <br/>
        <h3>${"Projects"}</h3><br/>
        <p>${"The World Bank’s Country Partnership Framework (CPF) with Togo is aligned with the PND and the government’s roadmap for 2020–2025. It finances several projects to:"}</p>
        <ol>
        <li>${"Foster private sector development and job creation by supporting the productive sectors, and access to energy and digital technology."}</li></ol>
        <li>${"Improve governance and build institutional capacity."}</li>
        <li>${"Strengthen human capital by improving access to essential public services including education, health, water and the expansion of social protection mechanisms."}</li>
        <li>${"Support environmental sustainability and resilience."}</li>
        </ol>
        
        <h4>${"References"}</h4>
        <a href="https://www.worldbank.org/en/country/togo#:~:text=Togo%20At%2DA%2DGlance&text=Although%20the%20poverty%20rate%20fell,the%20poverty%20line%20in%202015." target="_blank">Poverty & Equity Brief of Togo by World Bank </a>
        </br>
        <a href="https://www.wfp.org/operations/tg01-togo-transitional-icsp-january-2018-june-2019" target="_blank">Togo Transitional ICSP by World Food Programme </a>
        
        <h4>${"Poverty Comparision Images"}</h4>
        <img src="./Images/Togo1.png" alt="Change in Poverty in Togo in every 5 years" width="80%">
        <p>Change in Poverty in Togo in every 5 years</p>
        <img src="./Images/Togo1.png" alt="Poverty Ratio in Togo under $5.50 per day" width="80%">
        <p>Poverty Ratio in Togo under $5.50 per day</p>
        </div>`
      }
      else if (country.id == 324){   // Guinea
        str += `<div><p>${"Poverty remains widespread in Guinea. The poverty rate at the national poverty line has hovered around 55 percent between 2002 and 2012, with a slight dip in 2007. The lack of poverty reduction at the national level is a result of the low economic growth over this period, although results vary somewhat across sub-national regions. Following the outbreak of Ebola in 2014 and the decrease in commodity prices that undermined economic growth, poverty and living standards are expected to have worsened."}</p></div>`
        str += `<div>
        <h4>${"Poverty Ratio"}</h4>
        <li>${"2018 - 43.7%"}</li>
        <li>${"2019 - 47.3%"}</li>
        <li>${"2021 - 47.7%"}</li>
        <li>${"2022 - 50.1%"}</li>
        </br>

        <p>${"<b>Poverty:</b> Simulations indicate that the national poverty incidence increased from 47.3 percent in 2018 to 47.7percent in 2021, corresponding to more than half a million additional poor."}</p>
        <p>${"<b>Reason:</b> Guinea exhibits substantial regional heterogeneity in poverty rates, with Labé presenting the highest rate (66 percent compared to 31 percent in Kankan). The increase in global commodity prices exacerbated inflation in 2021, pushing more people into poverty."}</p>

        <h4>${"References"}</h4>
        <a href="https://databankfiles.worldbank.org/public/ddpext_download/poverty/33EF03BB-9722-4AE2-ABC7-AA2972D68AFE/Global_POVEQ_GIN.pdf" target="_blank">World Bank Country Profile for Guinea </a>
        </br>
        <a href="https://hdr.undp.org/sites/default/files/Country-Profiles/MPI/GIN.pdf" target="_blank">UNDP Country Profile for Guinea </a>
        </br>
        <a href="https://www.imf.org/en/Publications/CR/Issues/2016/12/31/Guinea-Poverty-Reduction-Strategy-Paper-40732" target="_blank">IMF staff Country Report for Guinea </a>
        
        <h4>${"Poverty Comparision Images"}</h4>
        <img src="./Images/Guinea1.png" alt="Poverty Headcount Rate in Guinea" width="80%">
        <p>Poverty Headcount Rate in Guinea</p>
        <img src="./Images/Guinea2.png" alt="The most recent MPI for Angola relative" width="80%">
        <p>The most recent MPI for Angola relative</p>
        </div>`
      }
      else if (country.id == 204){   // Benin
        str += `<div><p>${"Due to the modest average per capita GDP growth rate of 2.5 percent over the period 2013-2019, poverty remains widespread in Benin. The national poverty headcount rate based on the recently released WAEMU Harmonized household survey was 38.5 percent in 2019. The economy decelerated in 2020, with real GDP growth losing 5 percentage points in 2020 despite remaining positive at 2 percent (-1.0 percent in per capita terms), as the COVID-19 crisis affected global demand, containment measures hindered services and a recession hit Nigeria with negative impact on household consumption. For instance, efforts in poverty reduction might suffer from the effects of the resurgence of the COVID-19 pandemic."}</p></div>`
        str += `<div>
        <p>${"<b>Poverty:</b> Benin poverty rate at national poverty line was at level of 38.5 % in 2019, unchanged from the previous year. The description is composed by our digital data assistant. National poverty rate is the percentage of the population living below the national poverty line."}</p>
        <p>${"<b>Reason:</b> Monoculture and pesticide use damages the land's fertility and reduces cotton and other crop production. Eighty percent of Benin's population earns a living through agriculture, and this puts millions of people in a vulnerable position. Farmers may face low rainfall in dry seasons and disastrous floods in wet seasons."}</p>

        <br/>
        <h3>${"Projects"}</h3><br/>
        <p>${"The World Bank’s Country Partnership Framework (CPF) with Togo is aligned with the PND and the government’s roadmap for 2020–2025. It finances several projects to:"}</p>
        <ol>
        <li>${"Foster private sector development and job creation by supporting the productive sectors, and access to energy and digital technology."}</li></ol>
        <li>${"Improve governance and build institutional capacity."}</li>
        <li>${"Strengthen human capital by improving access to essential public services including education, health, water and the expansion of social protection mechanisms."}</li>
        <li>${"Support environmental sustainability and resilience."}</li>
        </ol>
        
        <h4>${"Dumping Site by Europe"}</h4>
        <p>${"Many African countries — such as Nigeria, Zimbabwe, Ghana, Republic of Benin, among others — receive huge containers filled with used electronic devices such as phones, kitchen appliances and even automobiles that are no longer road worthy for European streets."}</p>
        <p>${"The cars — often in disrepair — have frequently been involved in ghastly accidents in Europe before being shipped to Africa. "}</p>
        <p>${"Most items that land here have been rejected as unusable in Europe but are sent to Africa with the excuse that they are somehow useful to the people there. "}</p>
        <p>${"According to a UN report, the world produced over 53 million tons of electronic waste in 2019 alone — up by 21% in just five years."}</p>
        
        <h4>${"References"}</h4>
        <a href="ttps://databankfiles.worldbank.org/public/ddpext_download/poverty/987B9C90-CB9F-4D93-AE8C-750588BF00QA/AM2020/Global_POVEQ_BEN.pdf" target="_blank">Poverty & Equity Brief of Benin by World Bank </a>
        </br>
        <a href="https://www.macrotrends.net/countries/BEN/benin/poverty-rate" target="_blank">Benin Poverty Rate 2003-2023 by Macrotrends </a>
        
        
        <h4>${"Poverty Comparision Images"}</h4>
        <img src="./Images/Benin1.png" alt="Historical Poverty Dayta of Benin under $5.50 per day" width="80%">
        <p>Historical Poverty Dayta of Benin under $5.50 per day</p>
        <img src="./Images/Benin2.png" alt="Poverty Ranking of Benin wrt Other African Countries" width="80%">
        <p>Poverty Ranking of Benin wrt Other African Countries</p>
        </div>`
      }
      else if (country.id == 270){   // Gambia
        str += `<div><p>${"With a total area of 10, 690 sq km, the Republic of The Gambia is the smallest country on mainland Africa. It is located in West Africa, bordered on the West by the Atlantic Ocean and on the other three sides by Senegal.</br>Prior to the COVID-19 induced crisis, poverty declined at a slow pace in The Gambia. The national poverty rate declined from 48.6 percent in 2015 to an estimated 45.8 percent in 2019, due to low and variable economic growth. Data collected in 2020 shows that national poverty rate increased to 53.4 percent, instead of declining to a projected 44.9 percent based on pre-COVID-19 growth rates. This implies that about 1.1 million Gambians were poor in 2020."}</p></div>`
        str += `<div>
        </br>

        <p>${"<b>Poverty:</b> Based on these estimates, 41.7 percent of the population in Gambia (1,101 thousand people in 2021) is multidimensionally poor while an additional 28.0 percent is classified as vulnerable to multidimensional poverty (740 thousand people in 2021)."}</p>
        <p>${"<b>Reason:</b> The sharp increase in projected poverty (1.9pp increase in 2022 compared to a 1.2pp increase in 2021) is largely due to weaker growth in per capita GDP, and high prices eroding the purchasing power of households."}</p>

        <h4>${"References"}</h4>
        <a href="https://databankfiles.worldbank.org/public/ddpext_download/poverty/987B9C90-CB9F-4D93-AE8C-750588BF00QA/current/Global_POVEQ_GMB.pdf" target="_blank">Poverty & Equity Brief of Gambia by World Bank </a>
        </br>
        <a href="https://www.un.org/ohrlls/sites/www.un.org.ohrlls/files/the-gambia-eradicating-poverty-enhancing-agriculture-food-security-and-rural-development.pdf" target="_blank">Multidimensional Poverty Index 2023 by UNDP </a>
        </div>`
      } 
      else if (country.id == 384){   // Côte d'Ivoire
        str += `<div><p>${"Côte d'Ivoire was one of the fastest-growing economies in Sub-Saharan Africa, with real GDP per capita growth averaging 5.5 percent between 2015 and 2019. This economic success has been associated with a decline in poverty and an expansion of the middle class. The poverty rate using the national poverty line declined to reach 39.5 percent in 2018/19 from 44.0 percent in 2015, while the middle class expanded from 34.6 percent to 36.5 percent over the same period. But a third of the middle-class households are still vulnerable to poverty. The COVID-19 crisis reversed recent gains, highlighting the high level of vulnerability of the population to shocks and the need to strengthen resilience. The real GDP per capita contracted by 5.2 ppt, declining to - 0.6 percent in 2020, which resulted in a 1.8 ppt increase in poverty rate from its pre-COVID projection of 36.8 percent. Poverty projections estimated that such economic contraction has pushed about half a million people into poverty, driven by job losses and lower incomes for the self-employed."}</p></div>`
        str += `<div>
        <h4>${"Factors contributed to Economic Performace"}</h4>
        <p>${"Factors contributed to the country’s strong economic performance since 2012:"}</p>
        <ul><li>Sustaining robust and inclusive private sector-driven growth amid fiscal consolidation is a key policy challenge.</li>
        <li>Actions to improve the business climate are gaining momentum, including in agriculture.</li>
        <li>Côte d’Ivoire’s frontier market status, and favorable conditions on the international capital markets, have expanded financing options but debt needs to be firmly anchored on a sustainable path.</li>
        <li>The Ivoirien government has committed to reduce the budget deficit to the West African Economic and Monetary Union (WAEMU) ceiling of 3 percent of GDP by 2019.</li>
        <li>New prudential rules are reinforcing banking sector stability, but remaining pockets of vulnerabilities should be addressed.</li></ul>

        <h4>${"References"}</h4>
        <a href="https://databankfiles.worldbank.org/public/ddpext_download/poverty/987B9C90-CB9F-4D93-AE8C-750588BF00QA/previous/Global_POVEQ_CIV.pdf" target="_blank">Poverty & Equity Brief of Côte d'Ivoire by World Bank </a>
        </br>
        <a href="https://www.imf.org/en/News/Articles/2018/06/29/NA-062918-Cote-d-Ivoire-Sustaining-Its-Economic-Transformation" target="_blank">Multidimensional Poverty Index 2023 by IMF </a>
        </br>
        
        <h4>${"Poverty Comparision Images"}</h4>
        <img src="./Images/CI1.png" alt="Poverty Headcount Rate in Côte d'Ivoire" width="80%">
        <p>Poverty Headcount Rate in Côte d'Ivoire</p>
        <img src="./Images/CI2.png" alt="Growth v/s Poverty Reduction in Côte d'Ivoire" width="80%">
        <p>Growth v/s Poverty Reduction in Côte d'Ivoire</p>
        </div>`
      }
      else if (country.id == 288){   // Ghana
        str += `<div><p>${"It can be taken as an example for reducing poverty in the African Continent."}</p></div>`
        str += `<div>
        <h4>${"Poverty Ratio"}</h4>
        <li>${"2016 - 13.3%"}</li>
        <li>${"2017 - 12.3%"}</li>
        <li>${"2018 - 11.7%"}</li>
        <li>${"2019 - 11.1% "}</li>
        <li>${"2020 - 11.2% (COVID)"}</li>
        <li>${"2021 - 11.3%"}</li>
        <li>${"2022 - 11.3%"}</li>
        </br>
        
        <p>${"The country has made tremendous progress in reducing poverty in recent decades. But its success has been uneven and significant inequalities still exist, especially between the south and the north where the majority of the population lives on less than $1 a day."}</p>
        <p>${"Most of the waste is coming from Europe because we are connected to the Atlantic Ocean. Most of the waste we are seeing around our beaches is not from Ghana.</br>\"Six percent of the clothing that comes in [to Africa] is already trash and that number has actually gone up from what we have found out previously — and that could be a shirt that somebody painted their house in and they wiped their hands all over, and then they end up over here [in Ghana],\" Ricketts lamented. She said that some of the items were intentionally destroyed and should never have ended up in Africa."}</p>

        <h4>${"Dumping Site by Europe"}</h4>
        <p>${"Many African countries — such as Nigeria, Zimbabwe, Ghana, Republic of Benin, among others — receive huge containers filled with used electronic devices such as phones, kitchen appliances and even automobiles that are no longer road worthy for European streets."}</p>
        <p>${"The cars — often in disrepair — have frequently been involved in ghastly accidents in Europe before being shipped to Africa. "}</p>
        <p>${"Most items that land here have been rejected as unusable in Europe but are sent to Africa with the excuse that they are somehow useful to the people there. "}</p>
        <p>${"According to a UN report, the world produced over 53 million tons of electronic waste in 2019 alone — up by 21% in just five years."}</p>
        
        <h4>${"References"}</h4>
        <a href="https://databankfiles.worldbank.org/public/ddpext_download/poverty/987B9C90-CB9F-4D93-AE8C-750588BF00QA/current/Global_POVEQ_GHA.pdf" target="_blank">Poverty & Equity Brief of Ghana by World Bank </a>
        </br>
        <a href="https://www.statista.com/statistics/1222084/international-poverty-rate-in-ghana/" target="_blank">International poverty rate in Ghana from 2017 to 2022 by Statistica </a>
        </br>
        <a href="https://hdr.undp.org/sites/default/files/Country-Profiles/MPI/GHA.pdf" target="_blank">Multidimensional Poverty Index 2023 bu UNDP </a>
        
        <h4>${"Poverty Comparision Images"}</h4>
        <img src="./Images/Ghana1.png" alt="Poverty rate in Ghana in Recent Years" width="80%">
        <p>Poverty rate in Ghana in Recent Years</p>
        <img src="./Images/Ghana2.png" alt="Poverty Headcount Rate in Ghana" width="80%">
        <p>Poverty Headcount Rate in Ghana</p>
        <img src="./Images/Ghana3.png" alt="The most recent MPI for Angola relative" width="80%">
        <p>The most recent MPI for Angola relative</p>
        </div>`
      }
      else if (country.id == 566){   // Nigeria
        str += `<div><p>${"It can be taken as an example for reducing poverty in the African Continent."}</p></div>`
        str += `<div>
        <p>${"<b>Poverty:</b> In Nigeria, 40.1% of people are poor according to the 2018/19 national monetary poverty line, and 63% are multidimensionally poor according to the National MPI 2022. Multidimensional poverty is higher in rural areas, where 72% of people are poor, compared to 42% of people in urban areas."}</p>
        <p>${"<b>Reason:</b> Unemployment, corruption, non-diversification of the economy, income inequality, laziness, and a poor education system can be considered to be some of the key factors contributing to poverty in Nigeria"}</p>
        </div>
        <div>
        <p>${"Based on the most recent official household survey data from Nigeria's National Bureau of Statistics, 30.9 percent of Nigerians lived below the international extreme poverty line of $2.15 per person per day (2017 PPP) in 2018/19; just before the COVID-19 crisis. This estimate differs from previous Poverty and Equity Briefs that used the $1.90 2011 PPP line only because the cross-country price adjustments and poverty lines used to calculate international poverty rates have been updated and does not reflect any true change in poverty. Regardless of the yardstick used, Nigeria remains spatially unequal, with poverty clustered in the country's north and in rural areas. Among those living below the $2.15 poverty line in 2018/19, 79.4 percent lived in Nigeria's northern states and 86.8 percent lived in rural areas"}</p>

        <h4>${"Dumping Site by Europe"}</h4>
        <p>${"Many African countries — such as Nigeria, Zimbabwe, Ghana, Republic of Benin, among others — receive huge containers filled with used electronic devices such as phones, kitchen appliances and even automobiles that are no longer road worthy for European streets."}</p>
        <p>${"The cars — often in disrepair — have frequently been involved in ghastly accidents in Europe before being shipped to Africa. "}</p>
        <p>${"Most items that land here have been rejected as unusable in Europe but are sent to Africa with the excuse that they are somehow useful to the people there. "}</p>
        <p>${"According to a UN report, the world produced over 53 million tons of electronic waste in 2019 alone — up by 21% in just five years."}</p>
        
        <h4>${"References"}</h4>
        <a href="https://blogs.worldbank.org/africacan/what-does-moving-2017-ppps-and-new-international-poverty-lines-mean-nigeria" target="_blank"> Can Africa end Poverty? </a>
        </br>
        <a href="https://databankfiles.worldbank.org/public/ddpext_download/poverty/987B9C90-CB9F-4D93-AE8C-750588BF00QA/current/Global_POVEQ_NGA.pdf target="_blank">Poverty & Equity Brief of Nigeria by World Bank </a>
        </br>
        
        <h4>${"Poverty Comparision Images"}</h4>
        <img src="./Images/Nigeria1.png" alt="Poverty Headcount Rate in Nigeria" width="80%">
        <p>Poverty Headcount Rate in Nigeria</p>
        </div>`
      }
      else if(country.id == 834) 
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction"}</h3>
        <p>${"Tanzania, a vast and diverse East African nation, offers a rich tapestry of landscapes, from the plains of the Serengeti to the towering heights of Mount Kilimanjaro. Yet, beneath this natural wonderland, Tanzania grapples with a distinct set of environmental challenges, intricately linked to its pursuit of economic development and environmental preservation."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <h5>${"Land Degradation and Soil Erosion:"}</h5><br/>
        <p>${"Tanzania faces pervasive land degradation and soil erosion, driven by a combination of factors including deforestation, overgrazing, and unsustainable farming practices. This threat not only diminishes agricultural productivity but also jeopardizes the stability of Tanzania's ecosystems."}</p><br/>
        <h5>${"Water Resource Management: "}</h5><br/>
        <p>${"Managing water resources is a delicate balancing act in Tanzania. While it boasts abundant freshwater bodies like Lake Victoria, Lake Tanganyika, and Lake Malawi, uneven distribution, pollution, and inadequate sanitation infrastructure remain significant challenges. Access to clean water and sanitation services is often a daily struggle for many Tanzanians"}</p><br/>
        <h5>${" Wildlife Conservation and Habitat Loss"}</h5><br/>
        <p>${"Home to the famous Serengeti National Park and the Ngorongoro Conservation Area, Tanzania treasures its rich wildlife heritage. However, poaching, habitat loss due to agriculture, and Environmental Science & Technology PAGE 10 the expansion of infrastructure continue to threaten iconic species such as lions and cheetahs. The loss of critical habitats disrupts the intricate balance of ecosystems."}</p><br/>
        <h5>${"Energy Access and Deforestation: "}</h5><br/>
        <p>${"A large portion of Tanzania's population relies on traditional biomass fuels like firewood and charcoal for cooking and heating. This dependence accelerates deforestation, further contributing to land degradation and biodiversity loss. Access to cleaner and more sustainable energy sources is a growing concern."}</p><br/>
        <h3>${"Pressing Issue: Land Degradation and Soil Erosion"}</h3><br/>
        <p>${"Among Tanzania's multifaceted environmental challenges, land degradation and soil erosion take center stage. Unsustainable land-use practices, such as deforestation and overcultivation, lead to the erosion of fertile topsoil, negatively impacting agricultural yields. Moreover, soil erosion contributes to sedimentation in rivers and lakes, affecting water quality and aquatic ecosystems."}</p><br/>
        <h3>${"Graphs and Satellite Images:"}</h3><br/>
        <a href="https://www.google.com/url?sa=i&url=http%3A%2F%2Fwww.tanga.climatemps.com%2Fgraph.php&psig=AOvVaw0vW7pU6Ji7bccROb7aPpU5&ust=1699945950779000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCOj5-aW2wIIDFQAAAAAdAAAAABAI">
        <img src="tanzania1.png" alt="Description of the image" width="80%">
        </a><br/>
        <a href="https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.grida.no%2Fresources%2F5152&psig=AOvVaw0vW7pU6Ji7bccROb7aPpU5&ust=1699945950779000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCOj5-aW2wIIDFQAAAAAdAAAAABAo">
        <img src="tanzania2.png" alt="Description of the image" width="80%">
        </a><br/>
        <h5>${"[Land Degradation Trends]"}</h5><br/>
        <p>${"A graph depicting the trends in land degradation and soil erosion rates over the past decade, emphasizing regional variations."}</p><br/>
        <h5>${"[Water Pollution Map]"}</h5><br/>
        <p>${"A satellite image illustrating water pollution hotspots in Tanzania, highlighting areas most affected by contamination."}</p><br/>
        <h5>${"[Habitat Loss Patterns]"}</h5><br/>
        <p>${"A series of satellite images showcasing the patterns of habitat loss in key wildlife areas, underlining the extent of the challenge faced by conservation efforts."}</p><br/>
        <h5>${"[Energy Transition Progress]"}</h5><br/>
        <p>${"Graphs representing the progress in transitioning to cleaner and more sustainable energy sources in Tanzania, with a focus on the reduction of biomass fuel usage."}</p><br/>
        <p>${"These visuals and information present a comprehensive portrait of Tanzania's distinctive environmental landscape. Our aim is to illuminate the unique challenges faced by this nation and contribute to the development of strategies that foster sustainable development while preserving the country's exceptional natural heritage. We envision a Tanzania where land degradation is curtailed, water resources are effectively managed, wildlife thrives, and access to clean energy becomes widespread."}       
        </div>`
      }
      else if(country.id == 800) // Uganda
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction"}</h3>
        <p>${"Nestled in the heart of East Africa, Uganda is a nation blessed with diverse landscapes, from the lush greenery of its national parks to the serene shores of Lake Victoria. However, amidst this natural splendor, Uganda grapples with a set of environmental challenges unique to its geographical and socio-economic context."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <h5>${"Land Degradation and Soil Erosion:"}</h5><br/>
        <p>${"Uganda faces a persistent challenge of land degradation. Unsustainable agricultural practices, deforestation, and urbanization contribute to soil erosion, diminishing the fertility of the land. This not only affects agricultural productivity but also exacerbates sedimentation in water bodies."}</p><br/>
        <h5>${"Water Resource Management: "}</h5><br/>
        <p>${"While endowed with abundant water resources, Uganda struggles with equitable distribution and pollution. Access to safe drinking water remains a concern for many, and contamination from agriculture and urban centers impacts water quality. Effective management and infrastructure development are imperative."}</p><br/>
        <h5>${"Biodiversity Conservation:"}</h5><br/>
        <p>${"Uganda boasts a rich tapestry of biodiversity, including the famed mountain gorillas and a variety of bird species. However, habitat loss due to agriculture expansion and infrastructure development poses a threat. Conservation efforts are vital to safeguard these treasures and the tourism industry they support."}</p><br/>
        <h5>${"Energy Access and Transition:"}</h5><br/>
        <p>${"Energy access remains a challenge for a significant portion of Uganda's population. The reliance on traditional biomass fuels contributes to deforestation and indoor air pollution. The country is making strides in transitioning to cleaner and sustainable energy sources to address these issues."}</p><br/>
        <h3>${"Pressing Issue: Sustainable Energy Transition"}</h3><br/>
        <p>${"Among Uganda's complex environmental challenges, the transition to sustainable energy sources emerges as a pivotal concern. By promoting clean energy alternatives such as solar and hydroelectric power, Uganda aims to reduce its dependence on biomass fuels. This not only mitigates deforestation but also improves indoor air quality and public health."}</p><br/>
        <h3>${"Graphs and Satellite Images:"}</h3><br/>
        <a href="https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.ubos.org%2F&psig=AOvVaw3-nkYY6BerE61eDYPHSvxt&ust=1699945189154000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCJCc4rqzwIIDFQAAAAAdAAAAABAE">
            <img src="uganda1.png" alt="Description of the image" width="80%">
        </a><br/>
        <a href="https://www.google.com/url?sa=i&url=https%3A%2F%2Fugbusiness.com%2F2021%2F03%2Fuganda-economy%2F2020-full-year-gdp-growth&psig=AOvVaw3-nkYY6BerE61eDYPHSvxt&ust=1699945189154000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCJCc4rqzwIIDFQAAAAAdAAAAABAJ">
            <img src="uganda2.png" alt="Description of the image" width="80%">
        </a><br/>
        <h5>${"[Land Degradation Trends]"}</h5><br/>
        <p>${"A graph illustrating the trends in land degradation and soil erosion over the past decade, emphasizing regional disparities."}</p><br/>
        <h5>${"[Water Quality Map]"}</h5><br/>
        <p>${"A satellite image highlighting water quality variations across Uganda, pinpointing areas most affected by pollution."}</p><br/>
        <h5>${"[Habitat Loss Patterns]"}</h5><br/>
        <p>${"A series of satellite images showcasing habitat loss patterns in critical wildlife areas, underlining the challenges faced by conservation efforts."}</p><br/>
        <h5>${"[Energy Transition Progress]"}</h5><br/>
        <p>${"Graphs representing Uganda's progress in transitioning to cleaner energy sources, with a focus on the reduction of biomass fuel usage."}</p><br/>
        <p>${"These visuals and insights provide a unique perspective on Uganda's environmental landscape. The project aims to understand these intricate challenges, propose evidence-based solutions, and contribute to a future where Uganda's natural resources are preserved, energy access is equitable, and environmental harmony prevails."}       
        </div>`
      }
      else if(country.id == 646) // Rwanda
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction"}</h3>
        <p>${"Nestled in the heart of East Africa, Rwanda is a landlocked nation known as the \"Land of a Thousand Hills\" for its undulating terrain. Amidst its picturesque landscapes, Rwanda grapples with a unique set of environmental challenges that are closely intertwined with its remarkable journey towards sustainable development."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <h5>${"Soil Erosion and Land Management:"}</h5><br/>
        <p>${"Rwanda's hilly terrain makes it vulnerable to soil erosion, particularly in agricultural areas. This erosion diminishes soil fertility and poses a threat to crop yields. Sustainable land management practices are essential to combat this challenge."}</p><br/>
        <h5>${"Water Resource Sustainability: "}</h5><br/>
        <p>${"Access to clean and safe water is a crucial concern in Rwanda, especially in rural areas. With a growing population and increasing demand for water, equitable distribution and resource management are vital to ensure sustainability."}</p><br/>
        <h5>${"Biodiversity Conservation:"}</h5><br/>
        <p>${"Rwanda is home to a variety of ecosystems and wildlife, including the endangered mountain gorillas. However, habitat loss due to agriculture expansion and infrastructure development poses a significant threat. Conservation efforts are central to safeguarding these invaluable resources."}</p><br/>
        <h5>${"Sustainable Energy Transition:"}</h5><br/>
        <p>${"Rwanda has made commendable progress in transitioning to clean and renewable energy sources. However, ensuring that this transition is equitable and accessible to all remains a challenge, particularly in rural areas."}</p><br/>
        <h3>${"Pressing Issue: Soil Erosion and Land Management"}</h3><br/>
        <p>${"Among Rwanda's environmental challenges, soil erosion and land management take center stage. The country's hilly terrain makes it susceptible to erosion, which not only impacts agriculture but also contributes to sedimentation in water bodies. Sustainable land management practices and reforestation initiatives are essential to address this issue."}</p><br/>
        <h3>${"Graphs and Satellite Images:"}</h3><br/>
        <h5>${"[Soil Erosion Trends]"}</h5><br/>
        <p>${"A graph illustrating the trends in soil erosion rates over the past decade, highlighting areas most affected and showcasing regional variations."}</p><br/>
        <h5>${"[Water Resource Distribution Map]"}</h5><br/>
        <p>${"A satellite image showcasing water resource distribution across Rwanda, emphasizing disparities and underscoring the need for equitable management."}</p><br/>
        <h5>${"[Habitat Loss Patterns]"}</h5><br/>
        <p>${"A series of satellite images depicting habitat loss patterns in critical wildlife areas, emphasizing the challenges faced by conservation efforts."}</p><br/>
        <h5>${"[Energy Transition Progress]"}</h5><br/>
        <p>${"Graphs representing Rwanda's progress in transitioning to cleaner energy sources, with a focus on accessibility and rural electrification."}</p><br/>
        <p>${"These visuals and insights provide a unique perspective on Rwanda's environmental landscape. The project aims to understand these intricate challenges, propose evidence-based solutions, and contribute to a future where Rwanda's natural resources are preserved, water resources are effectively managed, and environmental sustainability prevails."}       
        </div>`
      }
      else if(country.id == 108) // Burundi
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction"}</h3>
        <p>${"Nestled in the heart of East Africa, Burundi is a small, landlocked nation known for its stunning landscapes and warm hospitality. Despite its natural beauty, Burundi faces a unique set of environmental challenges that are closely tied to its social and economic development."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <h5>${"Deforestation and Soil Erosion:"}</h5><br/>
        <p>${"Deforestation, driven by agriculture expansion and the demand for firewood, poses a significant challenge in Burundi. This leads to soil erosion, which impacts agricultural productivity and exacerbates food insecurity."}</p><br/>
        <h5>${"Water Resource Management:"}</h5><br/>
        <p>${"Access to clean water is a pressing concern in Burundi, particularly in rural areas. Uneven distribution, pollution, and inadequate sanitation infrastructure contribute to water-related health issues."}</p><br/>
        <h5>${"Biodiversity Conservation: "}</h5><br/>
        <p>${"Burundi is home to diverse ecosystems and species, including unique birdlife and endangered primates. Habitat loss due to deforestation and land-use changes threatens these treasures. Conservation efforts are essential for preserving biodiversity."}</p><br/>
        <h5>${"Sustainable Energy Transition:"}</h5><br/>
        <p>${"Like many East African nations, Burundi faces energy challenges. The reliance on traditional biomass fuels contributes to deforestation and indoor air pollution. Transitioning to cleaner and sustainable energy sources is crucial."}</p><br/>
        <h3>${"Pressing Issue: Deforestation and Soil Erosion"}</h3><br/>
        <p>${"Among Burundi's environmental challenges, deforestation and soil erosion take center stage. Unsustainable land-use practices and the demand for firewood have led to significant deforestation, which, in turn, has caused soil erosion. This affects agricultural productivity and contributes to food insecurity, especially among rural communities."}</p><br/>
        <h3>${"Graphs and Satellite Images:"}</h3><br/>
        <h5>${"[Deforestation Trends]"}</h5><br/>
        <p>${"A graph illustrating trends in deforestation rates over the past decade, emphasizing regional disparities and highlighting areas most affected."}</p><br/>
        <h5>${"[Water Quality Map]"}</h5><br/>
        <p>${"A satellite image showcasing variations in water quality across Burundi, pinpointing areas most impacted by pollution."}</p><br/>
        <h5>${"[Habitat Loss Patterns]"}</h5><br/>
        <p>${"A series of satellite images depicting habitat loss patterns in critical wildlife areas, emphasizing the challenges faced by conservation efforts."}</p><br/>
        <h5>${"[Energy Transition Progress]"}</h5><br/>
        <p>${"Graphs representing Burundi's progress in transitioning to cleaner energy sources, with a focus on rural electrification and reducing biomass fuel usage."}</p><br/>
        <p>${"These visuals and insights provide a unique perspective on Burundi's environmental landscape. The project aims to understand these intricate challenges, propose evidence-based solutions, and contribute to a future where Burundi's natural resources are preserved, water resources are effectively managed, and environmental sustainability prevails."}       
        </div>
        <div class="image-container">
        <a href="https://www.statista.com/chart/1543/burundi-has-the-worlds-highest-hunger-levels/">
            <img src="Burundi_img_1.jpeg" alt="Description of the image" width="80%">
        </a>
        </div>
        </div>
        <div class="image-container">
        <a href="https://www.globalhungerindex.org/case-studies/2016-burundi.html">
            <img src="Burundi_img_2.png" alt="Description of the image" width="80%">
        </a>
        </div>
        </div>`
      }
      else if(country.id == 728) // South Sudan
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction"}</h3>
        <p>${"South Sudan,the world's youngest nation, is located in northeastern Africa and is marked by its vast landscapes and natural beauty. However, the nation grapples with a unique set of environmental challenges that intersect with its social and political dynamics."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <h5>${"Deforestation and Land Degradation:"}</h5><br/>
        <p>${"South Sudan faces significant deforestation driven by factors such as agricultural expansion, logging, and the production of charcoal for fuel. This contributes to land degradation and soil erosion, affecting agricultural productivity and rural livelihoods."}</p><br/>
        <h5>${"Water Resource Management:"}</h5><br/>
        <p>${" Despite abundant water resources, equitable distribution and access to clean water remain major challenges in South Sudan. Pollution, inadequate sanitation infrastructure, and the impacts of climate change exacerbate these issues."}</p><br/>
        <h5>${"Biodiversity Conservation:"}</h5><br/>
        <p>${"South Sudan is home to diverse ecosystems and wildlife, including the critically endangered white rhinoceros. Habitat loss due to deforestation, poaching, and human-wildlife conflicts poses a threat to these valuable resources."}</p><br/>
        <h5>${"Energy Access and Sustainability:"}</h5><br/>
        <p>${"Access to reliable and sustainable energy sources is limited in South Sudan. The use of traditional biomass fuels contributes to deforestation and indoor air pollution. The nation is exploring options for cleaner and more sustainable energy."}</p><br/>
        <h3>${"Pressing Issue: Deforestation and Land Degradation"}</h3><br/>
        <p>${"Among South Sudan's environmental challenges, deforestation and land degradation take center stage. Unsustainable land-use practices, including the production of charcoal, have led to significant deforestation. This not only impacts forests but also exacerbates soil erosion, affecting agricultural productivity and rural communities."}</p><br/>
        <h3>${"Graphs and Satellite Images:"}</h3><br/>
        <h5>${"[Deforestation Trends]"}</h5><br/>
        <p>${"A graph illustrating trends in deforestation rates over the past decade, highlighting regional disparities and areas most affected."}</p><br/>
        <h5>${"[Water Resource Distribution Map]"}</h5><br/>
        <p>${" A satellite image showcasing water resource distribution across South Sudan, emphasizing disparities and areas most impacted by water scarcity."}</p><br/>
        <h5>${"[Habitat Loss Patterns]"}</h5><br/>
        <p>${" A series of satellite images depicting habitat loss patterns in critical wildlife areas, emphasizing the challenges faced by conservation efforts."}</p><br/>
        <h5>${"[Energy Transition Progress]"}</h5><br/>
        <p>${"Graphs representing South Sudan's progress in transitioning to cleaner energy sources, with a focus on rural electrification and reducing biomass fuel usage."}</p><br/>
        <p>${"These visuals and insights provide a unique perspective on South Sudan's environmental landscape. The project aims to understand these intricate challenges, propose evidence-based solutions, and contribute to a future where South Sudan's natural resources are preserved, water resources are effectively managed, and environmental sustainability prevails."}       

        <div class="image-container">
        <a href="https://www.researchgate.net/figure/Poverty-Indices-in-Southern-Sudan-2009_tbl2_272563260">
            <img src="Sudan_img_1.png" alt="Description of the image" width="80%">
        </a>
        </div>
        <div class="image-container">
        <a href="https://www.google.co.in/url?sa=i&url=https%3A%2F%2Fblogs.worldbank.org%2Fafricacan%2Fhow-conflict-and-economic-crises-exacerbate-poverty-in-south-sudan&psig=AOvVaw2K3YDoZIi4waQEMsvEh3rX&ust=1699430093946000&source=images&cd=vfe&opi=89978449&ved=0CBQQjhxqFwoTCKi1vMq0sYIDFQAAAAAdAAAAABAT">
            <img src="Sudan.webp" alt="Description of the image" width="80%">
        </a>
        </div>
        <div class="image-container">
        <a href="https://www.imf.org/en/News/Articles/2020/11/19/na112020-four-things-to-know-about-how-fragile-states-like-south-sudan-are-coping-with-covid19">
            <img src="Sudan_img_3.png" alt="Description of the image" width="80%">
        </a>
        </div>
        </div>`
      }
      else if(country.id == 706) //Somalia
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction"}</h3>
        <p>${"Somalia, located in the Horn of Africa, boasts a diverse landscape ranging from arid deserts to lush coastal regions. Despite its natural beauty, Somalia faces a complex set of environmental challenges that intersect with its socio-economic dynamics and historical conflicts."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <h5>${"Desertification and Land Degradation:"}</h5><br/>
        <p>${"Somalia's arid and semi-arid regions are prone to desertification and land degradation. Overgrazing, deforestation, and unsustainable land-use practices have exacerbated these issues, impacting agricultural productivity and food security."}</p><br/>
        <h5>${"Water Resource Scarcity:"}</h5><br/>
        <p>${"Access to clean water is a pressing concern in Somalia, exacerbated by recurrent droughts and limited infrastructure. Unequal distribution, competition for resources, and climate change contribute to water scarcity challenges."}</p><br/>
        <h5>${"Coastal Erosion and Marine Conservation:"}</h5><br/>
        <p>${"Somalia's extensive coastline is vulnerable to coastal erosion, exacerbated by factors like climate change and illegal fishing. Protecting marine ecosystems and resources is essential for livelihoods and food security."}</p><br/>
        <h5>${"Energy Access and Sustainability: "}</h5><br/>
        <p>${"Access to energy, especially in rural areas, is limited. Dependence on traditional biomass fuels contributes to deforestation and indoor air pollution. Somalia is exploring renewable energy options for sustainability."}</p><br/>
        <h3>${"Pressing Issue: Desertification and Land Degradation"}</h3><br/>
        <p>${"Among Somalia's environmental challenges, desertification and land degradation are pressing issues. Prolonged droughts, coupled with unsustainable land-use practices, have led to the expansion of arid areas and the degradation of fertile land. This affects agriculture and food security, particularly for vulnerable communities."}</p><br/>
        <h3>${"Graphs and Satellite Images:"}</h3><br/>
        <a href="https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.britannica.com%2Fplace%2FSomalia&psig=AOvVaw02YijlFQk1X1Rf6sUAOGqn&ust=1699945610241000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCOCyzIO1wIIDFQAAAAAdAAAAABAE">
            <img src="somalia1.png" alt="Description of the image" width="80%">
        </a><br/>
        <a href="https://www.google.com/url?sa=i&url=http%3A%2F%2Fwww.gaalkacyo.climatemps.com%2Fgraph.php&psig=AOvVaw33SKQXLPgp8CVb-lykpKzi&ust=1699945740643000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCMCU4sG1wIIDFQAAAAAdAAAAABAE">
            <img src="somalia2.png" alt="Description of the image" width="80%">
        </a><br/>
        <h5>${"[Desertification Trends]"}</h5><br/>
        <p>${" A graph illustrating trends in desertification and land degradation over the past decade, emphasizing regional disparities and areas most affected."}</p><br/>
        <h5>${"[Water Scarcity Map]"}</h5><br/>
        <p>${"A satellite image highlighting variations in water scarcity across Somalia, pinpointing areas most impacted by limited access to clean water."}</p><br/>
        <h5>${"[Coastal Erosion Patterns]"}</h5><br/>
        <p>${" A series of satellite images depicting coastal erosion patterns along Somalia's coastline, emphasizing the challenges faced by coastal communities."}</p><br/>
        <h5>${"[Energy Transition Progress]"}</h5><br/>
        <p>${"Graphs representing Somalia's progress in transitioning to cleaner energy sources, with a focus on rural electrification and reducing biomass fuel usage."}</p><br/>
        <p>${"These visuals and insights provide a unique perspective on Somalia's environmental landscape. The project aims to understand these intricate challenges, propose evidence-based solutions, and contribute to a future where Somalia's natural resources are preserved, water resources are effectively managed, and environmental sustainability prevails."}       
        </div>`
      }
      else if(country.id == 262) // Djibouti
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction"}</h3>
        <p>${"Djibouti, strategically located in the Horn of Africa, is a small yet vibrant nation known for its unique landscapes and bustling port. Despite its geographical advantages, Djibouti faces a distinct set of environmental challenges that intersect with its role as a transportation hub and its pursuit of economic development."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <h5>${"Land Degradation and Soil Salinity:"}</h5><br/>
        <p>${"Djibouti's arid and semi-arid regions are prone to land degradation and soil salinity due to factors like overgrazing and climate change. This poses a threat to agricultural productivity and food security."}</p><br/>
        <h5>${"Water Scarcity and Quality: "}</h5><br/>
        <p>${"Access to freshwater resources is limited in Djibouti. Uneven distribution, competition for resources, and pollution affect water quality and availability, impacting public health and agriculture."}</p><br/>
        <h5>${"Coastal Erosion and Marine Conservation: "}</h5><br/>
        <p>${"Djibouti's extensive coastline is vulnerable to coastal erosion, aggravated by rising sea levels. Sustainable marine resource management is essential to preserve coastal ecosystems and livelihoods."}</p><br/>
        <h5>${"Energy Access and Sustainability: "}</h5><br/>
        <p>${"Djibouti aims to diversify its energy sources and reduce dependence on imported fossil fuels. Expanding access to renewable energy is critical for environmental sustainability and economic development."}</p><br/>
        <h3>${"Pressing Issue: Land Degradation and Soil Salinity"}</h3><br/>
        <p>${"Among Djibouti's environmental challenges, land degradation and soil salinity are pressing issues. Prolonged arid conditions, coupled with unsustainable land-use practices, have led to the deterioration of fertile land. This affects agriculture and food security, particularly for vulnerable communities."}</p><br/>
        <h3>${"Graphs and Satellite Images:"}</h3><br/>
        <h5>${"[Land Degradation Trends]"}</h5><br/>
        <p>${"A graph illustrating trends in land degradation and soil salinity over the past decade, emphasizing regional disparities and areas most affected."}</p><br/>
        <h5>${"[Water Resource Map]"}</h5><br/>
        <p>${"A satellite image highlighting water resource distribution across Djibouti, pinpointing areas most impacted by limited access to clean water."}</p><br/>
        <h5>${"[Coastal Erosion Patterns]"}</h5><br/>
        <p>${"A series of satellite images depicting coastal erosion patterns along Djibouti's coastline, emphasizing the challenges faced by coastal communities."}</p><br/>
        <h5>${"[Energy Transition Progress]"}</h5><br/>
        <p>${"Graphs representing Djibouti's progress in transitioning to cleaner energy sources, with a focus on renewable energy generation and reducing fossil fuel dependence."}</p><br/>
        <p>${"These visuals and insights provide a unique perspective on Djibouti's environmental landscape. The project aims to understand these intricate challenges, propose evidence-based solutions, and contribute to a future where Djibouti's natural resources are preserved, water resources are effectively managed, and environmental sustainability prevails."}       
        </div>`
      }
      else if(country.id == 174) // Comoros
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction"}</h3>
        <p>${"Comoros, an archipelago in the Indian Ocean, is known for its stunning beaches, diverse marine life, and lush landscapes. Despite its natural beauty, Comoros faces a unique set of environmental challenges that are closely tied to its geographical location and socio-economic dynamics."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <h5>${"Deforestation and Soil Erosion:"}</h5><br/>
        <p>${"Comoros experiences deforestation primarily due to agricultural expansion, logging, and the demand for firewood. This has led to soil erosion, negatively impacting agricultural productivity and food security."}</p><br/>
        <h5>${"Water Resource Management:"}</h5><br/>
        <p>${"Access to clean and safe water is a critical concern in Comoros, particularly in rural areas. Limited infrastructure, pollution, and the impacts of climate change contribute to water scarcity and health issues."}</p><br/>
        <h5>${"Coral Reef Conservation: "}</h5><br/>
        <p>${"Comoros is blessed with vibrant coral reefs, crucial for marine biodiversity and tourism. However, these ecosystems face threats from pollution, overfishing, and climate change-induced coral bleaching."}</p><br/>
        <h5>${"Energy Access and Sustainability: "}</h5><br/>
        <p>${"Access to reliable energy sources is limited, especially in remote areas. The dependence on traditional biomass fuels contributes to deforestation and indoor air pollution. Comoros is exploring renewable energy solutions."}</p><br/>
        <h3>${"Pressing Issue: Coral Reef Conservation"}</h3><br/>
        <p>${"Among Comoros' environmental challenges, coral reef conservation is a pressing concern. Vibrant coral reefs are vital for marine life and the tourism industry. However, these fragile ecosystems are threatened by pollution, overfishing, and the impacts of climate change. Protecting and preserving coral reefs is essential for Comoros' marine biodiversity and economy."}</p><br/>
        <h3>${"Graphs and Satellite Images:"}</h3><br/>
        <h5>${"[Deforestation Trends]"}</h5><br/>
        <p>${"A graph illustrating trends in deforestation rates over the past decade, highlighting regional disparities and areas most affected."}</p><br/>
        <h5>${"[Water Scarcity Map]"}</h5><br/>
        <p>${"A satellite image showcasing variations in water scarcity across Comoros, pinpointing areas most impacted by limited access to clean water."}</p><br/>
        <h5>${"[Coral Reef Health Index]"}</h5><br/>
        <p>${"Visual representations of the health of coral reefs in Comoros, indicating areas most affected by coral bleaching and degradation."}</p><br/>
        <h5>${"[Energy Transition Progress]"}</h5><br/>
        <p>${"Graphs representing Comoros' progress in transitioning to cleaner energy sources, with a focus on renewable energy adoption and rural electrification."}</p><br/>
        <p>${"These visuals and insights provide a unique perspective on Comoros' environmental landscape. The project aims to understand these intricate challenges, propose evidence-based solutions, and contribute to a future where Comoros' natural resources are preserved, water resources are effectively managed, and environmental sustainability prevails."}       
        </div>`
      }
      else if(country.id == 231) // Ethiopia
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction"}</h3>
        <p>${"Ethiopia, often referred to as the \"Roof of Africa\" due to its highlands, is a diverse nation known for its rich cultural heritage and stunning landscapes. Despite its natural beauty, Ethiopia faces a unique set of environmental challenges that are closely intertwined with its socio-economic dynamics and ambitions for development."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <h5>${"Deforestation and Land Degradation:"}</h5><br/>
        <p>${"Ethiopia experiences significant deforestation, driven by factors such as agricultural expansion, logging, and the demand for firewood. This has led to land degradation and soil erosion, affecting agricultural productivity and food security."}</p><br/>
        <h5>${"Water Resource Management:"}</h5><br/>
        <p>${"Access to clean and safe water is a critical concern, especially in rural areas. Rapid population growth, unequal distribution, and the impacts of climate change contribute to water scarcity and related health issues."}</p><br/>
        <h5>${"Biodiversity Conservation:"}</h5><br/>
        <p>${"Ethiopia is known for its diverse ecosystems and unique wildlife, including the Ethiopian wolf and the Gelada baboon. However, habitat loss due to deforestation, land-use changes, and poaching poses a significant threat to these invaluable resources."}</p><br/>
        <h5>${"Energy Access and Sustainability:"}</h5><br/>
        <p>${"Access to energy sources remains limited in Ethiopia. The dependence on traditional biomass fuels contributes to deforestation and indoor air pollution. The nation is making strides in expanding access to cleaner and sustainable energy sources."}</p><br/>
        <h3>${"Pressing Issue: Deforestation and Land Degradation"}</h3><br/>
        <p>${"Among Ethiopia's environmental challenges, deforestation and land degradation take center stage. Unsustainable land-use practices, coupled with population pressure, have led to significant deforestation. This not only impacts forests but also exacerbates soil erosion, affecting agricultural productivity and food security, especially in rural areas."}</p><br/>
        <h3>${"Graphs and Satellite Images:"}</h3><br/>
        <a href="https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.researchgate.net%2Ffigure%2FClimate-graph-of-Kaftahumera-Ethiopia-Source-Ethiopian-Institute-of-Agricultural_fig2_344925700&psig=AOvVaw2cDPvCk9W8QhJaH50bqnId&ust=1699945345674000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCJiPuYW0wIIDFQAAAAAdAAAAABAY">
            <img src="ethopia1.png" alt="Description of the image" width="80%">
        </a><br/>
        <a href="https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.bbc.com%2Fnews%2Fworld-africa-57428039&psig=AOvVaw2cDPvCk9W8QhJaH50bqnId&ust=1699945345674000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCJiPuYW0wIIDFQAAAAAdAAAAABAf">
            <img src="ethopia2.png" alt="Description of the image" width="80%">
        </a><br/>
        <a href="https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.economist.com%2Fgraphic-detail%2F2019%2F05%2F14%2Fafter-drought-famine-and-war-ethnic-conflict-now-plagues-ethiopia&psig=AOvVaw2cDPvCk9W8QhJaH50bqnId&ust=1699945345674000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCJiPuYW0wIIDFQAAAAAdAAAAABAn">
            <img src="ethopia3.png" alt="Description of the image" width="80%">
        </a><br/>
        <h5>${"[Deforestation Trends]"}</h5><br/>
        <p>${"A graph illustrating trends in deforestation rates over the past decade, emphasizing regional disparities and areas most affected."}</p><br/>
        <h5>${"[Water Scarcity Map]"}</h5><br/>
        <p>${"A satellite image showcasing variations in water scarcity across Ethiopia, pinpointing areas most impacted by limited access to clean water."}</p><br/>
        <h5>${"[Habitat Loss Patterns]"}</h5><br/>
        <p>${"A series of satellite images depicting habitat loss patterns in critical wildlife areas, emphasizing the challenges faced by conservation efforts."}</p><br/>
        <h5>${"[Energy Transition Progress]"}</h5><br/>
        <p>${"Graphs representing Ethiopia's progress in transitioning to cleaner energy sources, with a focus on renewable energy adoption and rural electrification."}</p><br/>
        <p>${"These visuals and insights provide a unique perspective on Ethiopia's environmental landscape. The project aims to understand these intricate challenges, propose evidence-based solutions, and contribute to a future where Ethiopia's natural resources are preserved, water resources are effectively managed, and environmental sustainability prevails."}       
        </div>`
      }
      else if(country.id == 232) // Eriteria
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction"}</h3>
        <p>${"Eritrea, located in the Horn of Africa, is a nation with a diverse landscape that includes mountains, deserts, and a stunning coastline along the Red Sea. Despite its natural beauty, Eritrea faces a unique set of environmental challenges that intersect with its history, geography, and development goals."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <h5>${"Deforestation and Land Degradation: "}</h5><br/>
        <p>${"Eritrea experiences deforestation primarily due to agricultural expansion, urbanization, and the demand for firewood. This leads to land degradation, soil erosion, and reduced agricultural productivity."}</p><br/>
        <h5>${"Water Resource Management: "}</h5><br/>
        <p>${"Access to clean and safe water is a critical concern in Eritrea, especially in rural areas. Uneven distribution, over-extraction of groundwater, and the impacts of climate change contribute to water scarcity and related health issues."}</p><br/>
        <h5>${"Marine Resource Conservation: "}</h5><br/>
        <p>${"Eritrea's Red Sea coastline is rich in marine biodiversity and potential for fisheries. However, unsustainable fishing practices, pollution, and climate change pose threats to these valuable resources."}</p><br/>
        <h5>${"Energy Access and Sustainability: "}</h5><br/>
        <p>${"Access to modern energy sources is limited in Eritrea, particularly in rural areas. Dependence on traditional biomass fuels contributes to deforestation and indoor air pollution. The nation aims to expand access to sustainable energy."}</p><br/>
        <h3>${"Pressing Issue: Deforestation and Land Degradation"}</h3><br/>
        <p>${"Among Eritrea's environmental challenges, deforestation and land degradation are pressing concerns. Unsustainable land-use practices, coupled with population growth and urbanization, have led to significant deforestation. This not only impacts forests but also exacerbates soil erosion, affecting agricultural productivity and rural livelihoods."}</p><br/>
        <h3>${"Graphs and Satellite Images:"}</h3><br/>
        <h5>${"[Deforestation Trends]"}</h5><br/>
        <p>${"A graph illustrating trends in deforestation rates over the past decade, highlighting regional disparities and areas most affected."}</p><br/>
        <h5>${"[Water Scarcity Map]"}</h5><br/>
        <p>${"A satellite image showcasing variations in water scarcity across Eritrea, pinpointing areas most impacted by limited access to clean water."}</p><br/>
        <h5>${"[Marine Conservation Challenges]"}</h5><br/>
        <p>${"Visual representations of threats to Eritrea's marine resources, including overfishing and pollution, highlighting areas most affected."}</p><br/>
        <h5>${"[Energy Transition Progress]"}</h5><br/>
        <p>${"Graphs representing Eritrea's progress in transitioning to cleaner energy sources, with a focus on renewable energy adoption and rural electrification."}</p><br/>
        <p>${"These visuals and insights provide a unique perspective on Eritrea's environmental landscape. The project aims to understand these intricate challenges, propose evidence-based solutions, and contribute to a future where Eritrea's natural resources are preserved, water resources are effectively managed, and environmental sustainability prevails."}       
        </div>`
      }
      else if(country.id == 450) // Madagascar
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction"}</h3>
        <p>${"Madagascar, the world's fourth-largest island, is renowned for its exceptional biodiversity, unique ecosystems, and stunning landscapes. Despite its ecological richness, Madagascar faces a distinct set of environmental challenges that intersect with its fragile ecosystems and efforts for sustainable development."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <h5>${"Deforestation and Habitat Loss: "}</h5><br/>
        <p>${"Madagascar experiences one of the world's highest deforestation rates, primarily due to slash-and-burn agriculture, logging, and illegal logging. This threatens unique habitats and biodiversity, including lemurs and endemic plant species."}</p><br/>
        <h5>${"Water Resource Management: "}</h5><br/>
        <p>${"Access to clean water remains a challenge in Madagascar, particularly in rural areas. Pollution, unequal distribution, and inadequate sanitation infrastructure contribute to water scarcity and related health issues."}</p><br/>
        <h5>${"Marine Conservation: "}</h5><br/>
        <p>${"Madagascar boasts extensive coastlines and vibrant marine ecosystems. Unsustainable fishing practices, pollution, and coral bleaching are significant threats to marine biodiversity and the livelihoods of coastal communities."}</p><br/>
        <h5>${"Energy Access and Sustainability:"}</h5><br/>
        <p>${"Access to modern energy sources is limited in Madagascar, especially in remote regions. The reliance on traditional biomass fuels contributes to deforestation and indoor air pollution. The nation is working toward sustainable energy solutions."}</p><br/>
        <h3>${"Pressing Issue: Deforestation and Habitat Loss"}</h3><br/>
        <p>${"Among Madagascar's environmental challenges, deforestation and habitat loss are pressing issues. The island's unique ecosystems, including rainforests and dry forests, are rapidly disappearing. Unsustainable land-use practices and illegal logging threaten not only biodiversity but also the livelihoods of local communities."}</p><br/>
        <h3>${"Graphs and Satellite Images:"}</h3><br/>
        <h5>${"[Deforestation Trends]"}</h5><br/>
        <p>${"A graph illustrating trends in deforestation rates over the past decade, emphasizing regional disparities and areas most affected."}</p><br/>
        <h5>${"[Water Scarcity Map]"}</h5><br/>
        <p>${"A satellite image showcasing variations in water scarcity across Madagascar, pinpointing areas most impacted by limited access to clean water."}</p><br/>
        <h5>${"[Marine Conservation Challenges]"}</h5><br/>
        <p>${"Visual representations of threats to Madagascar's marine resources, including overfishing and pollution, highlighting areas most affected."}</p><br/>
        <h5>${"[Energy Transition Progress]"}</h5><br/>
        <p>${"Graphs representing Madagascar's progress in transitioning to cleaner energy sources, with a focus on renewable energy adoption and rural electrification."}</p><br/>
        <p>${"These visuals and insights provide a unique perspective on Madagascar's environmental landscape. The project aims to understand these intricate challenges, propose evidence-based solutions, and contribute to a future where Madagascar's unique biodiversity is preserved, water resources are effectively managed, and environmental sustainability prevails."}       
        </div>`
      }
      else if(country.id == 454) // Malawi
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction"}</h3>
        <p>${"Malawi, known as the \"Warm Heart of Africa\" due to its friendly people, is a landlocked nation in southeastern Africa. The country is blessed with beautiful landscapes, including Lake Malawi, but it faces a range of environmental challenges that intersect with its socio-economic development goals."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <h5>${"Deforestation and Land Degradation:"}</h5><br/>
        <p>${"Malawi experiences deforestation primarily due to agricultural expansion, logging, and charcoal production. This contributes to land degradation, soil erosion, and reduced agricultural productivity."}</p><br/>
        <h5>${"Water Resource Management:"}</h5><br/>
        <p>${"Access to clean and safe water remains a challenge in Malawi. Pollution, inadequate sanitation infrastructure, and the impacts of climate change contribute to water scarcity and related health issues."}</p><br/>
        <h5>${"Biodiversity Conservation: "}</h5><br/>
        <p>${"Malawi is home to diverse ecosystems and wildlife, including the African elephant and rhinoceros. However, habitat loss due to deforestation, agricultural expansion, and poaching poses a significant threat to these valuable resources."}</p><br/>
        <h5>${"Energy Access and Sustainability:"}</h5><br/>
        <p>${"Access to modern energy sources is limited in Malawi, especially in rural areas. Dependence on traditional biomass fuels contributes to deforestation and indoor air pollution. The nation is exploring renewable energy options."}</p><br/>
        <h3>${"Pressing Issue: Deforestation and Land Degradation"}</h3><br/>
        <p>${"Among Malawi's environmental challenges, deforestation and land degradation are pressing issues. Unsustainable land-use practices, coupled with population growth, have led to significant deforestation. This not only impacts forests but also exacerbates soil erosion, affecting agricultural productivity and rural livelihoods."}</p><br/>
        <h3>${"Graphs and Satellite Images:"}</h3><br/>
        <a href="https://www.google.com/url?sa=i&url=http%3A%2F%2Fwww.malawi.climatemps.com%2Fgraph.php&psig=AOvVaw0m9ujwP8gwxm8t5SsrEf9w&ust=1699946527902000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCOCpj7m4wIIDFQAAAAAdAAAAABAh">
        <img src="malawi1.png" alt="Description of the image" width="80%">
        </a><br/>
        <a href="https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.researchgate.net%2Ffigure%2FFigure-3-Malawi-annual-GDP-growth_fig3_309556382&psig=AOvVaw0m9ujwP8gwxm8t5SsrEf9w&ust=1699946527902000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCOCpj7m4wIIDFQAAAAAdAAAAABAp">
        <img src="malawi2.png" alt="Description of the image" width="80%">
        </a><br/>
        <h5>${"[Deforestation Trends]"}</h5><br/>
        <p>${"A graph illustrating trends in deforestation rates over the past decade, emphasizing regional disparities and areas most affected."}</p><br/>
        <h5>${"[Water Scarcity Map]"}</h5><br/>
        <p>${"A satellite image showcasing variations in water scarcity across Malawi, pinpointing areas most impacted by limited access to clean water."}</p><br/>
        <h5>${"[Habitat Loss Patterns]"}</h5><br/>
        <p>${"A series of satellite images depicting habitat loss patterns in critical wildlife areas, emphasizing the challenges faced by conservation efforts."}</p><br/>
        <h5>${"[Energy Transition Progress]"}</h5><br/>
        <p>${"Graphs representing Malawi's progress in transitioning to cleaner energy sources, with a focus on renewable energy adoption and rural electrification."}</p><br/>
        <p>${"These visuals and insights provide a unique perspective on Malawi's environmental landscape. The project aims to understand these intricate challenges, propose evidence-based solutions, and contribute to a future where Malawi's natural resources are preserved, water resources are effectively managed, and environmental sustainability prevails."}       
        </div>`
      }
      else if(country.id == 480) // Mauritius
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction"}</h3>
        <p>${"Mauritius, a picturesque island nation in the Indian Ocean, is renowned for its stunning beaches, diverse marine life, and unique biodiversity. However, this tropical paradise faces a set of environmental challenges that are closely linked to its small landmass, tourism industry, and fragile ecosystems."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <h5>${"Deforestation and Habitat Loss: "}</h5><br/>
        <p>${"Mauritius has faced significant deforestation over the years due to agricultural expansion, urbanization, and invasive species. This threatens the island's unique habitats and biodiversity, including rare bird species like the Mauritius kestrel."}</p><br/>
        <h5>${"Marine Conservation: "}</h5><br/>
        <p>${"While Mauritius' coral reefs and marine ecosystems are vital for its economy and biodiversity, they face threats from coral bleaching, overfishing, pollution, and habitat destruction."}</p><br/>
        <h5>${"Water Resource Management: "}</h5><br/>
        <p>${" Access to clean and safe water is essential, but Mauritius has experienced challenges related to water scarcity, uneven distribution, and pollution of water bodies."}</p><br/>
        <h5>${"Waste Management:"}</h5><br/>
        <p>${"With the growth in tourism and urbanization, the management of waste, including plastics, has become a significant concern. Sustainable waste management practices are essential."}</p><br/>
        <h3>${"Pressing Issue: Coral Reef Conservation"}</h3><br/>
        <p>${"Among Mauritius' environmental challenges, coral reef conservation is a pressing issue. The nation's coral reefs are essential for marine biodiversity, coastal protection, and tourism. However, coral bleaching and habitat destruction due to various factors threaten these ecosystems."}</p><br/>
        <h3>${"Graphs and Satellite Images:"}</h3><br/>
        <h5>${"[Deforestation Trends]"}</h5><br/>
        <p>${"A graph illustrating trends in deforestation rates over the past decade, emphasizing regional disparities and areas most affected."}</p><br/>
        <h5>${"[Coral Reef Health Index]"}</h5><br/>
        <p>${" Visual representations of the health of coral reefs around Mauritius, indicating areas most affected by coral bleaching and degradation."}</p><br/>
        <h5>${"[Water Resource Map]"}</h5><br/>
        <p>${"A satellite image showcasing variations in water scarcity across Mauritius, pinpointing areas most impacted by limited access to clean water."}</p><br/>
        <h5>${"[Waste Management Progress]"}</h5><br/>
        <p>${" Graphs representing Mauritius' progress in adopting sustainable waste management practices, with a focus on reducing plastic waste."}</p><br/>
        <p>${"These visuals and insights provide a unique perspective on Mauritius' environmental landscape. The project aims to understand these intricate challenges, propose evidence-based solutions, and contribute to a future where Mauritius' natural resources are preserved, water resources are effectively managed, and environmental sustainability prevails."}       
        </div>`
      }
      else if(country.id == 508) // Mozambique
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction"}</h3>
        <p>${"Mozambique, situated on the southeastern coast of Africa, is known for its stunning coastline, diverse ecosystems, and rich cultural heritage. Despite its natural beauty, Mozambique faces a range of environmental challenges that intersect with its socio-economic development goals."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <h5>${"Deforestation and Land Degradation: "}</h5><br/>
        <p>${"Mozambique experiences deforestation due to agricultural expansion, logging, and infrastructure development. This contributes to land degradation, soil erosion, and reduced agricultural productivity."}</p><br/>
        <h5>${"Water Resource Management: "}</h5><br/>
        <p>${"Access to clean and safe water remains a challenge in Mozambique. Climate change, unequal distribution, and inadequate sanitation infrastructure contribute to water scarcity and related health issues."}</p><br/>
        <h5>${"Biodiversity Conservation:"}</h5><br/>
        <p>${"Mozambique is home to diverse ecosystems and wildlife, including elephants and rhinoceroses. However, habitat loss due to deforestation, land-use changes, and poaching poses a significant threat to these valuable resources."}</p><br/>
        <h5>${"Energy Access and Sustainability:"}</h5><br/>
        <p>${"Access to modern energy sources is limited in Mozambique, especially in rural areas. Dependence on traditional biomass fuels contributes to deforestation and indoor air pollution. The nation is exploring renewable energy options."}</p><br/>
        <h3>${"Pressing Issue: Deforestation and Land Degradation"}</h3><br/>
        <p>${"Among Mozambique's environmental challenges, deforestation and land degradation are pressing issues. Unsustainable land-use practices and land conversion for agriculture and infrastructure development are major drivers of deforestation. This threatens not only forests but also exacerbates soil erosion, affecting agricultural productivity and rural livelihoods."}</p><br/>
        <h3>${"Graphs and Satellite Images:"}</h3><br/>
        <a href="https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.researchgate.net%2Ffigure%2FClimate-data-from-Mozambique-Average-precipitation-in-mm-rain-blue-bars-and-mean_fig1_329539222&psig=AOvVaw1_S9N_NOgdeRLv3MJl4yO1&ust=1699946351932000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCLiqo-W3wIIDFQAAAAAdAAAAABAE">
        <img src="mozambique1.png" alt="Description of the image" width="80%">
        </a><br/>
        <a href="https://www.google.com/url?sa=i&url=https%3A%2F%2Fen.m.wikipedia.org%2Fwiki%2FFile%3AMozambique-demography.png&psig=AOvVaw1_S9N_NOgdeRLv3MJl4yO1&ust=1699946351932000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCLiqo-W3wIIDFQAAAAAdAAAAABAp">
        <img src="mozambique2.png" alt="Description of the image" width="80%">
        </a><br/>
        <h5>${"[Deforestation Trends]"}</h5><br/>
        <p>${"A graph illustrating trends in deforestation rates over the past decade, emphasizing regional disparities and areas most affected."}</p><br/>
        <h5>${"[Water Scarcity Map]"}</h5><br/>
        <p>${"A satellite image showcasing variations in water scarcity across Mozambique, pinpointing areas most impacted by limited access to clean water."}</p><br/>
        <h5>${"[Habitat Loss Patterns]"}</h5><br/>
        <p>${"A series of satellite images depicting habitat loss patterns in critical wildlife areas, emphasizing the challenges faced by conservation efforts."}</p><br/>
        <h5>${"[Energy Transition Progress]"}</h5><br/>
        <p>${"Graphs representing Mozambique's progress in transitioning to cleaner energy sources, with a focus on renewable energy adoption and rural electrification."}</p><br/>
        <p>${"These visuals and insights provide a unique perspective on Mozambique's environmental landscape. The project aims to understand these intricate challenges, propose evidence-based solutions, and contribute to a future where Mozambique's natural resources are preserved, water resources are effectively managed, and environmental sustainability prevails."}       
        </div>`
      }
      else if(country.id == 690) // Seychelles
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction"}</h3>
        <p>${"Seychelles, an archipelago of 115 islands in the Indian Ocean, is celebrated for its pristine beaches, coral reefs, and vibrant marine life. However, this paradise faces a unique set of environmental challenges linked to its small size, vulnerability to climate change, and tourism-dependent economy."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <h5>${"Climate Change and Rising Sea Levels:"}</h5><br/>
        <p>${"Seychelles is highly vulnerable to climate change, with rising sea levels threatening its low-lying coastal areas. Beach erosion, saltwater intrusion, and damage to coastal ecosystems are significant concerns."}</p><br/>
        <h5>${"Marine Conservation: "}</h5><br/>
        <p>${"Seychelles' coral reefs, mangroves, and marine biodiversity are vital for its economy and culture. Coral bleaching, overfishing, and pollution pose threats to these ecosystems and the livelihoods of coastal communities."}</p><br/>
        <h5>${"Biodiversity Preservation: "}</h5><br/>
        <p>${"Seychelles is home to unique species like the Seychelles giant tortoise and the coco de mer palm. Habitat loss, invasive species, and poaching are challenges to biodiversity conservation."}</p><br/>
        <h5>${"Waste Management:"}</h5><br/>
        <p>${"With the influx of tourists and urbanization, waste management has become a significant concern. Sustainable waste management practices are crucial to preserving Seychelles' natural beauty."}</p><br/>
        <h3>${"Pressing Issue: Climate Change and Rising Sea Levels"}</h3><br/>
        <p>${"Among Seychelles' environmental challenges, climate change and rising sea levels are pressing issues. The nation's low-lying coastal areas are vulnerable to sea-level rise, and adaptation measures are essential to protect communities and coastal ecosystems."}</p><br/>
        <h3>${"Graphs and Satellite Images:"}</h3><br/>
        <h5>${"[Sea-Level Rise Projections]"}</h5><br/>
        <p>${"Graphs depicting projections of sea-level rise in Seychelles over the coming decades, emphasizing the areas most at risk."}</p><br/>
        <h5>${"[Coral Reef Health Index]"}</h5><br/>
        <p>${" Visual representations of the health of coral reefs around Seychelles, indicating areas most affected by coral bleaching and degradation."}</p><br/>
        <h5>${"[Biodiversity Conservation Efforts]"}</h5><br/>
        <p>${"Images showcasing Seychelles' efforts to conserve unique species and their habitats, highlighting success stories and ongoing challenges."}</p><br/>
        <h5>${"[Waste Management Progress]"}</h5><br/>
        <p>${"Graphs representing Seychelles' progress in adopting sustainable waste management practices, with a focus on reducing plastic waste and marine pollution."}</p><br/>
        <p>${"These visuals and insights provide a unique perspective on Seychelles' environmental landscape. The project aims to understand these intricate challenges, propose evidence-based solutions, and contribute to a future where Seychelles' natural resources are preserved, coastal communities are protected from climate impacts, and environmental sustainability prevails."}       
        </div>`
      }
      else if(country.id == 894) // Zambia
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction"}</h3>
        <p>${"Zambia, located in southern Africa, is celebrated for its diverse wildlife, stunning landscapes, and natural resources. However, the nation faces a range of environmental challenges linked to land use, wildlife conservation, and sustainable development."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <h5>${"Deforestation and Land Degradation: "}</h5><br/>
        <p>${"Zambia experiences deforestation due to agricultural expansion, logging, and charcoal production. This contributes to land degradation, soil erosion, and reduced agricultural productivity."}</p><br/>
        <h5>${"Wildlife Conservation: "}</h5><br/>
        <p>${" Zambia is home to iconic species like elephants, lions, and leopards. Poaching, habitat loss, and human-wildlife conflict pose threats to these valuable resources and ecosystems."}</p><br/>
        <h5>${"Water Resource Management: "}</h5><br/>
        <p>${"Access to clean water is vital, but Zambia faces challenges related to water scarcity, unequal distribution, and inadequate sanitation infrastructure."}</p><br/>
        <h5>${"Mining and Resource Extraction: "}</h5><br/>
        <p>${"Zambia's mining industry is a significant contributor to its economy. Sustainable management of mineral resources is essential to mitigate environmental impacts."}</p><br/>
        <h3>${"Pressing Issue: Wildlife Conservation"}</h3><br/>
        <p>${"Among Zambia's environmental challenges, wildlife conservation is a pressing issue. Iconic species such as elephants and rhinoceroses are under threat from poaching and habitat loss. Effective conservation efforts are crucial to protect Zambia's rich biodiversity."}</p><br/>
        <h3>${"Graphs and Satellite Images:"}</h3><br/>
        <a href="https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.researchgate.net%2Ffigure%2FZambias-Annual-GDP-growth-1964-2019_fig2_348886965&psig=AOvVaw0h8aS_2BlOJUT4zOtlSWUC&ust=1699946207184000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCID6qaC3wIIDFQAAAAAdAAAAABAR">
        <img src="zambia1.png" alt="Description of the image" width="80%">
        </a><br/>
        <a href="https://www.google.com/url?sa=i&url=http%3A%2F%2Fwww.lusaka.climatemps.com%2Fgraph.php&psig=AOvVaw0h8aS_2BlOJUT4zOtlSWUC&ust=1699946207184000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCID6qaC3wIIDFQAAAAAdAAAAABAp">
        <img src="zambia2.png" alt="Description of the image" width="80%">
        </a><br/>
        <h5>${"[Deforestation Trends]"}</h5><br/>
        <p>${"A graph illustrating trends in deforestation rates over the past decade, emphasizing regional disparities and areas most affected."}</p><br/>
        <h5>${"[Wildlife Conservation Initiatives]"}</h5><br/>
        <p>${"Images showcasing Zambia's efforts to protect and conserve wildlife, highlighting successful conservation projects and challenges faced."}</p><br/>
        <h5>${"[Water Scarcity Map]"}</h5><br/>
        <p>${"A satellite image showcasing variations in water scarcity across Zambia, pinpointing areas most impacted by limited access to clean water."}</p><br/>
        <h5>${"[Mining and Environmental Impact]"}</h5><br/>
        <p>${"Visual representations of the environmental impact of mining activities in Zambia, emphasizing efforts to promote sustainable mining practices."}</p><br/>
        <p>${"These visuals and insights provide a unique perspective on Zambia's environmental landscape. The project aims to understand these intricate challenges, propose evidence-based solutions, and contribute to a future where Zambia's natural resources are preserved, wildlife is protected, and environmental sustainability prevails."}       
        </div>`
      }
      else if(country.id == 716) // Zimbabwe
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction"}</h3>
        <p>${"Zimbabwe, located in southern Africa, is known for its diverse ecosystems, stunning landscapes, and rich cultural heritage. However, the nation faces a range of environmental challenges linked to land use, wildlife conservation, and sustainable development."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <h5>${"Deforestation and Land Degradation: "}</h5><br/>
        <p>${"Zimbabwe experiences deforestation due to agricultural expansion, logging, and fuelwood collection. This contributes to land degradation, soil erosion, and reduced agricultural productivity."}</p><br/>
        <h5>${"Wildlife Conservation: "}</h5><br/>
        <p>${"Zimbabwe boasts a wealth of biodiversity, including elephants, rhinoceroses, and numerous bird species. Poaching, habitat loss, and human-wildlife conflict pose threats to these valuable resources and ecosystems."}</p><br/>
        <h5>${"Water Resource Management: "}</h5><br/>
        <p>${"Access to clean water is vital, but Zimbabwe faces challenges related to water scarcity, pollution, and inadequate sanitation infrastructure."}</p><br/>
        <h5>${"Mining and Resource Extraction:"}</h5><br/>
        <p>${"Zimbabwe's mining industry is a significant contributor to its economy. Sustainable management of mineral resources is essential to mitigate environmental impacts."}</p><br/>
        <h3>${"Pressing Issue: Wildlife Conservation"}</h3><br/>
        <p>${"Among Zimbabwe's environmental challenges, wildlife conservation is a pressing issue. Iconic species such as elephants and rhinoceroses are under threat from poaching and habitat loss. Effective conservation efforts are crucial to protect Zimbabwe's rich biodiversity."}</p><br/>
        <h3>${"Graphs and Satellite Images:"}</h3><br/>
        <a href="https://www.google.com/url?sa=i&url=http%3A%2F%2Fnews.bbc.co.uk%2F2%2Fhi%2Fafrica%2F8622519.stm&psig=AOvVaw0JnjrBCPE6c8JMHaslrjkD&ust=1699946675167000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCJCssf-4wIIDFQAAAAAdAAAAABAI">
        <img src="zimbabwe1.png" alt="Description of the image" width="80%">
        </a><br/>
        <a href="https://www.google.com/url?sa=i&url=https%3A%2F%2Fblogs.worldbank.org%2Fafricacan%2Fzimbabwe-good-economic-genes-stunted-by-politics&psig=AOvVaw0JnjrBCPE6c8JMHaslrjkD&ust=1699946675167000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCJCssf-4wIIDFQAAAAAdAAAAABAg">
        <img src="zimbabwe2.png" alt="Description of the image" width="80%">
        </a><br/>
        <h5>${"[Deforestation Trends]"}</h5><br/>
        <p>${"A graph illustrating trends in deforestation rates over the past decade, emphasizing regional disparities and areas most affected."}</p><br/>
        <h5>${"[Wildlife Conservation Initiatives]"}</h5><br/>
        <p>${"Images showcasing Zimbabwe's efforts to protect and conserve wildlife, highlighting successful conservation projects and challenges faced."}</p><br/>
        <h5>${"[Water Scarcity Map]"}</h5><br/>
        <p>${"A satellite image showcasing variations in water scarcity across Zimbabwe, pinpointing areas most impacted by limited access to clean water."}</p><br/>
        <h5>${"[Mining and Environmental Impact]"}</h5><br/>
        <p>${"Visual representations of the environmental impact of mining activities in Zimbabwe, emphasizing efforts to promote sustainable mining practices."}</p><br/>
        <p>${"These visuals and insights provide a unique perspective on Zimbabwe's environmental landscape. The project aims to understand these intricate challenges, propose evidence-based solutions, and contribute to a future where Zimbabwe's natural resources are preserved, wildlife is protected, and environmental sustainability prevails."}       
        </div>`
      }
      else if(country.id == 716)
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction:"}</h3>
        <br/>
        <p>${"Zimbabwe is a landlocked country located in southern Africa. It shares borders with South Africa to the south, Botswana to the west and southwest, Mozambique to the east and northeast, and Zambia to the northwest."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <h4>${"Preserving Vital Ecosystems: Wetland Conservation Challenges in Zimbabwe : "}</h4>
        <p>${"Lake Chivero and Manyame Catchment Area (Harare):"}</p>
        <ol><li>${"Issue: Wetland degradation, deforestation, and pollution from urban development and agriculture have affected Lake Chivero and its catchment area."}</li><li>${"Scheme: Ongoing efforts by the Environmental Management Agency (EMA) and the Harare City Council to enforce land-use regulations and protect the catchment area."}</li></ol><br/>
        <p>${"Upper Manyame River Basin:"}</p>
        <ol><li>${"Issue: Mining activities, particularly gold mining, have resulted in sedimentation and water pollution in the Manyame River."}</li><li>${"Scheme: The Environmental Management Authority (EMA) has been responsible for regulating mining activities and ensuring compliance with environmental standards."}</li></ol><br/>
        <p>${"Mutare (Manicaland Province):"}</p>
        <ol><li>${"Issue: Unregulated sand mining along the Mutare River has led to erosion and habitat loss."}</li><li>${"Scheme: Environmental management and mining regulations enforced by EMA,including environmental impact assessments for sand mining operations."}</li></ol><br/>
        <p>${"Midlands Province:"}</p>
        <ol><li>${"Issue: Wetland conversion for agriculture and brickmaking activities is common in the Midlands."}</li><li>${"Scheme: Sustainable agriculture and land-use programs initiated by the Ministry of Lands, Agriculture, Water, and Rural Resettlement."}</li></ol><br/>
        <p>${"Hwange National Park (Matabeleland North Province):"}</p>
        <ol><li>${"Issue: Water extraction and mining activities around Hwange National Park threaten wetland ecosystems."}</li><li>${"Scheme: Long-standing conservation initiatives by the Zimbabwe Parks and Wildlife Management Authority to combat poaching and protect wildlife."}</li></ol><br/>
        <h3>${"Small-scale resource exploitation activities, primarily gold panning and agriculture, in the Zhulube Catchment located in the Limpopo Basin of Zimbabwe :"}</h3>
        <ol><li>${"Gold panning is a major driver of sediment generation, permanent hardness of water, and mercury contamination in water resources."}</li><li>${"Agriculture and population growth also contribute to sediment generation and environmental degradation in the catchment."}</li><li>${"There is a lack of systematic environmental and water quality monitoring in the Zhulube Catchment, which hinders informed decision-making."}</li><li>${"National legislation for environmental management exists but is not effectively applied at the local level due to limited capacity and resources of local authorities and agencies."}</li><li>${"Community involvement and the formalization of small-scale resource exploitation activities could help mitigate environmental impacts and promote sustainable development."}</li><li>${"Cleaner production techniques and technologies should be promoted to reduce the environmental footprint of resource exploitation activities."}</li></ol><br/>
        <h3>${" Feminization of poverty :"}</h3>
        <ol><li>${"Feminization of poverty particularly in Mutasa community in the Manicaland province."}</li><li>${"Gender Discrimination: Zimbabwe, like many other countries, has a history of gender discrimination. Women have traditionally been assigned to roles that are often less well-paid and have fewer opportunities for advancement. This discrimination can limit women's access to education, job opportunities, and resources."}</li><li>${"Economic Factors: The Zimbabwean economy has faced numerous challenges, including hyperinflation and economic instability. These factors have disproportionately affected women, who often have fewer economic resources and are more vulnerable to economic shocks."}</li><li>${"Agriculture: Agriculture is a significant sector in Zimbabwe's economy, and many women are engaged in small-scale farming. However, women often have limited access to land, credit, and agricultural extension services. This can result in lower agricultural productivity and income for female farmers."}</li></ol>
        </div>`
      }
      else if(country.id == 508)
      {
        str+=`<div>
        <br/>
          <h3>${"Introduction"}</h3><br/>
          <p>${"Mozambique is situated on the southeastern coast of Africa, bordered by Tanzania to the north, Malawi, Zambia, and Zimbabwe to the northwest, South Africa and Eswatini to the southwest, and the Indian Ocean to the east. The country has a long coastline along the Indian Ocean, which stretches for approximately 1,600 kilometers (994 miles)."}</p>
          <br/>
          <ol><li>${" High Poverty Rates: Mozambique is one of the world's poorest countries, with a large percentage of its population living below the poverty line. According to data available up to my knowledge cutoff datein September 2021, a substantial portion of the population lived in poverty, with many living on less than $1.90 per day, which is the international poverty line defined by the World Bank."}</li><li>${"Rural-Urban Disparities: Poverty in Mozambique is often more acute in rural areas than in urban centers. Many rural communities rely on subsistence farming and face challenges such as limited access to healthcare, education, and infrastructure."}</li><li>${"Impact of Armed Conflict: Mozambique has a history of armed conflict and civil war, which has contributed to poverty and underdevelopment. Conflicts disrupt economic activities, displace communities, and divert resources away from development efforts."}</li><li>${"Agriculture-Based Economy: The country's economy is heavily reliant on agriculture, which is vulnerable to climate-related challenges, such as droughts and floods. These events can have a devastating impact on rural livelihoods and contribute to poverty."}</li><li>${"Limited Access to Education and Healthcare: Access to education and healthcare services is limited, particularly in rural areas. This can hinder human capital development and perpetuate the cycle of poverty."}</li><li>${"Inequality: Income and wealth inequality are significant issues in Mozambique, with a small portion of the population holding a disproportionate share of the country's resources and wealth."}</li><li>${"Natural Disasters: Mozambique is susceptible to natural disasters, including cyclones and flooding, which can lead to loss of life, displacement, and destruction of infrastructure, further exacerbating poverty."}</li></ol>
        </div>`
      }
      else if(country.id == 454)
      {
        str+=`<div>
          <p>${"Agriculture and Subsistence Farming: The majority of Malawi's population relies on agriculture, mainly subsistence farming, for their livelihoods. While agriculture is essential for food security and income generation, unsustainable farming practices like deforestation for land clearance and inadequate soil conservation can lead to soil erosion and land degradation, making it difficult for farmers to escape poverty."}</p><br/>
          <p>${"Deforestation: Malawi has experienced significant deforestation due to logging, charcoal production, and land clearing for agriculture. This has detrimental effects on the environment, leading to soil erosion, loss of biodiversity, and reduced water quality. Poor rural communities often rely on forests for fuelwood and other resources, so deforestation impacts their daily lives."}</p><br/>
          <p>${"Access to Clean Water: Lack of access to clean water and sanitation is a significant challenge in Malawi. Environmental degradation, including water pollution from agricultural runoff and inadequate waste disposal, contributes to the scarcity of safe drinking water. Poor communities are particularly vulnerable to waterborne diseases and the economic burden of healthcare costs."}</p><br/>
          <p>${" Climate Change Vulnerability: Malawi is highly vulnerable to climate change, which has led to unpredictable rainfall patterns, droughts, and flooding. These climate-related events disrupt agricultural activities, damage infrastructure, and lead to food insecurity, particularly affecting impoverished rural communities."}</p><br/>
          <p>${"Resource Extraction: Malawi has limited mineral resources, and some forms of resource extraction may lead to environmental degradation if not properly regulated. Extractive industries can also raise issues of land rights and displacement of local communities."}</p><br/>
          <p>${"Land Degradation: Land degradation is a significant concern, partly due to unsustainable agricultural practices and overgrazing. This reduces land productivity and negatively impacts the livelihoods of rural communities who depend on agriculture."}</p><br/>
          <p>${"Poverty as a Driver of Environmental Exploitation: Poverty can drive people to exploit natural resources in unsustainable ways as they seek immediate income and sustenance. This includes illegal logging, poaching, and overfishing, all of which can further damage the environment."}</p>
        </div>`
      }
      else if(country.id == 894)
      {
        str += `<div>
        <p>${"Mining Industry: Zambia is known for its copper mining industry, which is a crucial part of the national economy. However, the extraction of minerals, including copper and cobalt, has sometimes led to environmental degradation. Poor regulation and oversight can result in pollution of water bodies and soil, harming both the environment and the health of nearby communities."}</p><br/>
        <p>${"Deforestation: Deforestation is a pressing environmental concern in Zambia. Logging, agricultural expansion, and charcoal production have contributed to widespread deforestation. The loss of forests impacts the environment by increasing soil erosion, reducing biodiversity, and affecting local climate patterns. It also affects the livelihoods of communities that depend on forests for resources."}</p><br/>
        <p>${"Agriculture and Land Degradation: Subsistence farming is a common practice in Zambia, and many rural communities rely on it for their livelihoods. Unsustainable farming practices, including overgrazing and poor soil management, have led to land degradation, which reduces agricultural productivity and exacerbates poverty."}</p><br/>
        <p>${"Water Resource Management: Zambia faces challenges in managing its water resources sustainably. Pollution from agriculture and mining can harm water quality, while water scarcity affects both agriculture and access to clean drinking water for communities."}</p><br/>
        <p>${" Climate Change Vulnerability: Zambia is vulnerable to climate change impacts, such as changing rainfall patterns, droughts, and flooding. These events can disrupt agricultural activities and lead to food insecurity, disproportionately affecting poor rural communities."}</p><br/>
        <p>${" Resource Extraction and Local Communities: The extraction of minerals and other resources often takes place in areas where local communities reside. Displacement, land rights issues, and limited benefits to local populations can exacerbate poverty and lead to social conflicts."}</p><br/>
        <p>${"Poverty as a Driver of Environmental Exploitation: Poverty can drive people to engage in unsustainable environmental practices out of necessity, such as illegal logging, poaching, and charcoal production, which can further damage the environment."}</p><br/>
        </div>`
      }
      else if(country.id == 140)
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction:"}</h3><br/>
        <p>${"CAR is situated in Central Africa and is bordered by several countries, including Chad to the north, Sudan and South Sudan to the northeast, the Democratic Republic of the Congo to the east, the Republic of the Congo to the south, and Cameroon to the west."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <ol><li>${"Natural Resource Exploitation: CAR is rich in natural resources, including timber, diamonds, gold, and other minerals. However, the unregulated and unsustainable exploitation of these resources has been a major problem. Logging, mining, and poaching have led to deforestation, habitat destruction, and loss of biodiversity."}</li><li>${"Conflict and Instability: CAR has experienced prolonged periods of conflict and political instability, with various rebel groups vying for control of resources and power. These conflicts have disrupted agriculture, displaced populations, and hindered economic development."}</li><li>${"Land Degradation: Unsustainable farming practices, such as slash-and-burn agriculture, have contributed to land degradation and soil erosion. This can reduce agricultural productivity and exacerbate food insecurity."}</li><li>${"Climate Change: Central Africa, including CAR, is vulnerable to the impacts of climate change, including changing rainfall patterns and increased temperatures. These changes can affect agriculture and water resources, further exacerbating poverty."}</li><li>${"Lack of Infrastructure: The country's infrastructure, including roads, electricity, and healthcare facilities, is underdeveloped, which hampers economic growth and access"}</li><li>${"Weak Governance and Corruption: Corruption and weak governance have hindered the effective management of natural resources and the equitable distribution of wealth in CAR. This has often benefited a few elites while leaving the majority of the population in poverty."}</li><li>${"Humanitarian Crisis: The combination of conflict, displacement, and environmental challenges has resulted in a severe humanitarian crisis in CAR. Many people lack access to basic necessities, such as clean water, healthcare, and education.The latest estimates, which date from 2020, show that roughly 71% of the population is living below the international poverty line ($1.90 per day, in terms of PPP)."}</li></ol>
        <div class="image-container">
        <a href="https://www.worldbank.org/en/country/centralafricanrepublic/publication/the-central-african-republic-economic-update-explained-in-5-charts">
            <img src="CAR_img_1.png" alt="Description of the image" width="80%">
        </a>
        </div>
        <div class="image-container">
        <a href="https://www.worldbank.org/en/country/centralafricanrepublic/publication/the-central-african-republic-economic-update-explained-in-5-charts">
            <img src="CAR_img_2.png" alt="Description of the image" width="80%">
        </a>
        </div>
        </div>`
        
      }
      else if(country.id == 180)
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction"}</h3><br/>
        <p>${"The DRC is the largest country in sub-Saharan Africa and the second-largest in Africa, after Algeria. It is located in Central Africa and is bordered by nine countries: Republic of the Congo to the west, Angola to the southwest, Zambia to the south, Tanzania to the east, Burundi, Rwanda, and Uganda to the east, South Sudan to the northeast, and the Central African Republic to the north."}</p><br/>
        <h5>${"1. Poverty in the DRC:"}</h5><br/>
        <ol><li>${"Economic Challenges: The DRC is one of the poorest countries in the world.Despite its vast mineral wealth, much of the population lives in extreme poverty. Economic development has been hampered by decades of conflict, corruption, and mismanagement of resources."}</li><li>${"High Poverty Rates: A large portion of the population lacks access to basic necessities such as clean water, adequate healthcare, education, and proper housing."}</li><li>${"Rural Poverty: Rural areas, where the majority of the population resides, often face food insecurity, limited access to markets, and inadequate infrastructure."}</li></ol><br/>
        <div class="image-container">
        <a href="https://www.elibrary.imf.org/view/journals/002/2015/281/article-A001-en.xml">
            <img src="DRC_img_1.jpg" alt="Description of the image" width="80%">
        </a>
        </div>
        <div class="image-container">
        <a href="https://hdr.undp.org/sites/default/files/Country-Profiles/MPI/COD.pdf">
            <img src="DRC_img_2.png" alt="Description of the image" width="80%">
        </a>
        </div>
        <h5></br>${"2. Environmental Exploitation:"}</h5><br/>
        <ol><li>${"Deforestation: The DRC is home to a significant portion of the world's second-largest rainforest, the Congo Basin. Deforestation, often driven by logging and agriculture, threatens biodiversity and contributes to climate change."}</li><li>${"Mineral Extraction: The DRC is rich in minerals, including coltan, cobalt, and gold, which are essential components in various electronics. However, the extraction of these minerals has often been associated with environmental degradation, including soil and water pollution."}</li><li>${"Wildlife Poaching: Poaching of endangered species, such as elephants and gorillas, for their ivory and meat is a serious issue in the DRC, particularly in the Virunga National Park."}</li></ol><br/>
        <h5>${"3. Impact of Conflict:"}</h5><br/>
        <ol><li>${"Conflict Minerals: The DRC has been plagued by conflict for decades, with armed groups fighting for control over resources. The illegal trade in conflict minerals has funded violence and perpetuated instability."}</li><li>${"Displacement: Ongoing conflict has resulted in the displacement of millions of people, leading to increased poverty, food insecurity, and reliance on unsustainable practices for survival."}</li></ol><br/>
        <h5>${"4. Environmental Conservation Efforts:"}</h5><br/>
        <ol><li>${"Conservation Initiatives: The DRC, with international support, has made efforts to protect its biodiversity and forests through conservation initiatives and national parks, such as Virunga and Garamba National Parks."}</li><li>${"Sustainable Development: There are efforts to promote sustainable development practices, including community-based forestry management and responsible mining, to reduce environmental harm while supporting local livelihoods."}</li></ol><br/>
        <h5>${"5. International Involvement:"}</h5><br/>
        <ol><li>${"International Assistance: Various international organizations and NGOs are actively involved in providing humanitarian aid, supporting conservation, and addressing poverty and conflict-related issues in the DRC."}</li></ol><br/>
        </div>`
      }
      else if(country.id == 108)
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction"}</h3><br/>
        <p>${"Burundi is situated in the African Great Lakes region and is bordered by Rwanda to the north, Tanzania to the east and south, and the Democratic Republic of the Congo and Lake Tanganyika to the west."}</p><br/>
        <p>${"The country is characterized by hilly terrain and a number of lakes, including Lake Tanganyika, one of the deepest freshwater lakes in the world."}</p><br/>
        <h5>${"1. Poverty in Burundi:"}</h5><br/>
        <ol><li>${"Economic Challenges: Burundi is one of the poorest countries in the world. The majority of the population relies on subsistence agriculture, and the country faces challenges in diversifying its economy."}</li><li>${"High Poverty Rates: A significant portion of the population lives in poverty, with limited access to basic services such as healthcare, education, and clean water."}</li><li>${"Food Insecurity: Malnutrition and food insecurity are prevalent, particularly in rural areas where many households struggle to produce enough food to meet their needs."}</li></ol><br/>
        <h5>${"2. Environmental Exploitation:"}</h5><br/>
        <ol><li>${"Deforestation: Burundi has experienced significant deforestation due to the expansion of agriculture and the demand for firewood and timber. This has led to soil erosion, reduced biodiversity, and adverse effects on local ecosystems."}</li><li>${"Soil Degradation: Unsustainable farming practices, such as slash-and-burn agriculture, have contributed to soil degradation, reducing agricultural productivity."}</li><li>${"Water Pollution: Pollution of water sources, often caused by inadequate waste disposal and agricultural runoff, poses health risks and affects the availability of clean water for drinking and irrigation."}</li></ol><br/>
        <h5>${"3. Impact of Conflict:"}</h5><br/>
        <ol><li>${"Historical Conflict: Burundi experienced ethnic conflict and a civil war in the past,which disrupted the economy and led to displacement and poverty."}</li><li>${"Displacement: Ongoing political tensions and violence have caused population displacement, with many people living in refugee camps or facing food insecurity."}</li></ol><br/>
        <h5>${"4. Conservation and Environmental Efforts:"}</h5><br/>
        <ol><li>${"Conservation Challenges: Despite its small size, Burundi has made efforts to conserve its natural resources. However, these efforts are often limited by poverty, lack of resources, and competing land-use demands."}</li><li>${"Sustainable Agriculture: Some organizations and initiatives aim to promote sustainable agricultural practices and reforestation to address soil degradation and deforestation."}</li></ol><br/>
        <h5>${"5. International Assistance:"}</h5><br/>
        <ol><li>${"Foreign Aid: Burundi has received foreign aid and assistance from international organizations and NGOs to address poverty, health issues, and environmental challenges."}</li><li>${"Capacity Building: International organizations work to strengthen the capacity of local institutions and communities to manage their natural resources sustainably."}</li></ol><br/>
        </div>`
      }
      else if(country.id == 404)
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction"}</h3>
        <p>${"Kenya, located in East Africa, is a land of astonishing ecological diversity. Its expansive landscapes, from the rolling savannas of the Maasai Mara to the towering peaks of Mount Kenya, house a plethora of wildlife and ecosystems. However, beneath this natural splendor lies a complex tapestry of environmental challenges that Kenya faces as it strives for development and conservation."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <h5>${"1. Poverty and Food Insecurity:"}</h5><br/>
        <p>${"A significant portion of Kenya's population grapples with poverty, particularly in rural areas. This dire economic situation intersects with food insecurity. The impacts of climate change, characterized by erratic rainfall and prolonged droughts, have left many vulnerable. Small-scale farmers and marginalized communities often bear the brunt, struggling to secure their next meal."}</p><br/>
        <h5>${"2. Water Scarcity:"}</h5><br/>
        <p>${"Kenya's water resources are unevenly distributed, with arid and semi-arid regions enduring chronic water scarcity. Access to clean, safe drinking water is a daily challenge for many, and the agricultural sector, a backbone of Kenya's economy, suffers due to irregular and inadequate water supplies."}</p><br/>
        <h5>${"3. Wildlife Exploitation:"}</h5><br/>
        <p>${"Kenya's wildlife is celebrated worldwide, yet it faces relentless threats. Poaching, driven by demand for ivory and other illegal wildlife products, poses a grave risk to iconic species like elephants and rhinoceroses. Illegal wildlife trade networks operate across borders, fueling this trade. Conservation efforts are critical to protect these creatures and safeguard the tourism industry, a significant contributor to Kenya's economy."}</p><br/>
        <h5>${"4. Deforestation:"}</h5><br/>
        <p>${"Unchecked deforestation, propelled by expanding agriculture, logging, and infrastructure development, is contributing to soil erosion, habitat loss, and increased greenhouse gas emissions. Forested areas are rapidly shrinking, compromising biodiversity and the crucial role forests play in regulating the climate."}</p><br/>
        <h3>${"Pressing Issue: Wildlife Conservation"}</h3><br/>
        <p>${"Among these pressing environmental challenges, wildlife conservation emerges as a paramount concern. Kenya's unique ecosystems, such as the Maasai Mara and Amboseli National Park, serve as global biodiversity hotspots. The conservation of these habitats and their charismatic inhabitants, like lions and giraffes, isn't just an ethical imperative but also a linchpin of Kenya's economy. Wildlife tourism draws visitors from across the globe, bolstering revenue and creating employment opportunities."}</p><br/>
        <h3>${"Graphs and Satellite Images:"}</h3><br/>
        <a href="https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.researchgate.net%2Ffigure%2FIncome-poverty-in-Kenya-Sens-Index-1914-76_fig4_336693327&psig=AOvVaw1efJ9DA4Me5phs917272zo&ust=1699944922412000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCPji07uywIIDFQAAAAAdAAAAABAJ">
            <img src="KenyaPoverty.png" alt="Description of the image" width="80%">
        </a><br/>
        <h5>${"Poverty and Food Insecurity Trends"}</h5><br/>
        <p>${"A line graph depicting trends in poverty rates and food insecurity over the past decade, highlighting variations and correlations."}</p><br/>
        <h5>${"Water Scarcity Map"}</h5><br/>
        <p>${"A satellite image pinpointing water scarcity hotspots in Kenya, emphasizing regions most affected by this critical issue."}</p><br/>
        <h5>${"Deforestation Patterns"}</h5><br/>
        <p>${"A series of satellite images showcasing the patterns of deforestation in Kenya over the years, underscoring the extent of forest loss."}</p><br/>
        <h5>${"Wildlife Conservation Impact"}</h5><br/>
        <p>${"Graphs illustrating the outcomes of wildlife conservation efforts, including changes in poaching incidents and wildlife population trends."}</p><br/>
        <p>${"These visuals and information provide a comprehensive overview of Kenya's intricate environmental landscape. They exemplify our dedication to gaining a profound understanding of the challenges Kenya faces and our commitment to formulating strategies that harmonize development and conservation. Our aspiration is for Kenya to maintain its rich natural heritage,alleviate the impacts of poverty, and fosterenvironmental sustainability."}       
        </div>`
      }
      // else if(country.id == 706)
      // {
      //   str+=`<div>
      //   <br/>
      //   <h3>${"Introduction:"}</h3><br/>
      //   <p>${"Somalia, located in the Horn of Africa, boasts a diverse landscape ranging from arid deserts to lush coastal regions. Despite its natural beauty, Somalia faces a complex set of environmental challenges that intersect with its socio-economic dynamics and historical conflicts."}</p><br/>
      //   <h3>${"Environmental Challenges:"}</h3><br/>
      //   <h5>${"1. Desertification and Land Degradation:"}</h5>
      //   <p>${"Somalia's arid and semi-arid regions are prone to desertification and land degradation. Overgrazing, deforestation, and unsustainable land-use practices have exacerbated these issues, impacting agricultural productivity and food security."}</p><br/>
      //   <h5>${"2. Water Resource Scarcity:"}</h5><br/>
      //   <p>${"Access to clean water is a pressing concern in Somalia, exacerbated by recurrent droughts and limited infrastructure. Unequal distribution, competition for resources, and climate change contribute to water scarcity challenges."}</p><br/>
      //   <h5>${"3. Coastal Erosion and Marine Conservation:"}</h5><br/>
      //   <p>${"Somalia's extensive coastline is vulnerable to coastal erosion, exacerbated by factors like climate change and illegal fishing. Protecting marine ecosystems and resources is essential for livelihoods and food security."}</p><br/>
      //   <h5>${"4. Energy Access and Sustainability:"}</h5><br/>
      //   <p>${"Access to energy, especially in rural areas, is limited. Dependence on traditional biomass fuels contributes to deforestation and indoor air pollution. Somalia is exploring renewable energy options for sustainability."}</p><br/>
      //   <h3>${"Pressing Issue: Desertification and Land Degradation"}</h3><br/>
      //   <p>${"Among Somalia's environmental challenges, desertification and land degradation are pressing issues. Prolonged droughts, coupled with unsustainable land-use practices, have led to the expansion of arid areas and the degradation of fertile land. This affects agriculture and food security, particularly for vulnerable communities."}</p><br/>
      //   <h3>${"Graphs and Satellite Images:"}</h3><br/>
      //   <h5>${"Desertification Trends"}</h5><br/>
      //   <p>${"A graph illustrating trends in desertification and land degradation over the past decade, emphasizing regional disparities and areas most affected."}</p><br/>
      //   <h5>${"Water Scarcity Map"}</h5><br/>
      //   <p>${"A satellite image highlighting variations in water scarcity across Somalia, pinpointing areas most impacted by limited access to clean water."}</p><br/>
      //   <h5>${"Coastal Erosion Patterns"}</h5><br/>
      //   <p>${"A series of satellite images depicting coastal erosion patterns along Somalia's coastline, emphasizing the challenges faced by coastal communities."}</p><br/>
      //   <h5>${"Energy Transition Progress"}</h5><br/>
      //   <p>${"Graphs representing Somalia's progress in transitioning to cleaner energy sources, with a focus on rural electrification and reducing biomass fuel usage."}</p>
      //   </div>`
      // }
      else if(country.id == 231)
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction"}</h3>
        <p>${"Ethiopia, often referred to as the 'Roof of Africa' due to its highlands, is a diverse nation known for its rich cultural heritage and stunning landscapes. Despite its natural beauty, Ethiopia faces a unique set of environmental challenges that are closely intertwined with its socio-economic dynamics and ambitions for development."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <h5>${"1. Deforestation and Land Degradation:"}</h5><br/>
        <p>${"Ethiopia experiences significant deforestation, driven by factors such as agricultural expansion, logging, and the demand for firewood. This has led to land degradation and soil erosion, affecting agricultural productivity and food security."}</p><br/>
        <h5>${"2. Water Resource Management:"}</h5><br/>
        <p>${"Access to clean and safe water is a critical concern, especially in rural areas. Rapid population growth, unequal distribution, and the impacts of climate change contribute to water scarcity and related health issues."}</p><br/>
        <h5>${"3. Biodiversity Conservation:"}</h5><br/>
        <p>${"Ethiopia is known for its diverse ecosystems and unique wildlife, including the Ethiopian wolf and the Gelada baboon. However, habitat loss due to deforestation, land-use changes, and poaching poses a significant threat to these invaluable resources."}</p><br/>
        <h5>${"4. Energy Access and Sustainability:"}</h5><br/>
        <p>${"Access to energy sources remains limited in Ethiopia. The dependence on traditional biomass fuels contributes to deforestation and indoor air pollution. The nation is making strides in expanding access to cleaner and sustainable energy sources."}</p><br/>
        <h3>${"Pressing Issue: Deforestation and Land Degradation"}</h3><br/>
        <p>${"Among Ethiopia's environmental challenges, deforestation and land degradation take center stage. Unsustainable land-use practices, coupled with population pressure, have led to significant deforestation. This not only impacts forests but also exacerbates soil erosion, affecting agricultural productivity and food security, especially in rural areas."}</p><br/>
        <h3>${"Graphs and Satellite Images:"}</h3><br/>
        <h5>${"Deforestation Trends"}</h5><br/>
        <p>${"A graph illustrating trends in deforestation rates over the past decade, emphasizing regional disparities and areas most affected."}</p><br/>
        <h5>${"Water Scarcity Map"}</h5><br/>
        <p>${"A satellite image showcasing variations in water scarcity across Ethiopia, pinpointing areas most impacted by limited access to clean water."}</p><br/>
        <h5>${"Habitat Loss Patterns"}</h5><br/>
        <p>${"A series of satellite images depicting habitat loss patterns in critical wildlife areas, emphasizing the challenges faced by conservation efforts."}</p><br/>
        <h5>${"Energy Transition Progress"}</h5><br/>
        <p>${"Graphs representing Ethiopia's progress in transitioning to cleaner energy sources, with a focus on renewable energy adoption and rural electrification."}</p><br/>
        </div>`
      }
      else if(country.id == 232)
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction"}</h3><br/>
        <p>${"Eritrea, located in the Horn of Africa, is a nation with a diverse landscape that includes mountains, deserts, and a stunning coastline along the Red Sea. Despite its natural beauty, Eritrea faces a unique set of environmental challenges that intersect with its history, geography, and development goals."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <h5>${"1. Deforestation and Land Degradation:"}</h5><br/>
        <p>${"Eritrea experiences deforestation primarily due to agricultural expansion, urbanization, and the demand for firewood. This leads to land degradation, soil erosion, and reduced agricultural productivity."}</p><br/>
        <h5>${"2. Water Resource Management:"}</h5><br/>
        <p>${"Access to clean and safe water is a critical concern in Eritrea, especially in rural areas. Uneven distribution, over-extraction of groundwater, and the impacts of climate change contribute to water scarcity and related health issues."}</p><br/>
        <h5>${"3. Marine Resource Conservation:"}</h5><br/>
        <p>${"Eritrea's Red Sea coastline is rich in marine biodiversity and potential for fisheries. However, unsustainable fishing practices, pollution, and climate change pose threats to these valuable resources."}</p><br/>
        <h5>${"4. Energy Access and Sustainability:"}</h5><br/>
        <p>${"Access to modern energy sources is limited in Eritrea, particularly in rural areas. Dependence on traditional biomass fuels contributes to deforestation and indoor air pollution. The nation aims to expand access to sustainable energy."}</p><br/>
        <h3>${"Pressing Issue: Deforestation and Land Degradation"}</h3><br/>
        <p>${"Among Eritrea's environmental challenges, deforestation and land degradation are pressing concerns. Unsustainable land-use practices, coupled with population growth and urbanization, have led to significant deforestation. This not only impacts forests but also exacerbates soil erosion, affecting agricultural productivity and rural livelihoods."}</p><br/>
        <h3>${"Graphs and Satellite Images:"}</h3><br/>
        <h5>${"Deforestation Trends"}</h5><br/>
        <p>${"A graph illustrating trends in deforestation rates over the past decade, highlighting regional disparities and areas most affected."}</p><br/>
        <h5>${"Water Scarcity Map"}</h5><br/>
        <p>${"A satellite image showcasing variations in water scarcity across Eritrea, pinpointing areas most impacted by limited access to clean water."}</p><br/>
        <h5>${"Marine Conservation Challenges"}</h5><br/>
        <p>${"Visual representations of threats to Eritrea's marine resources, including overfishing and pollution, highlighting areas most affected."}</p><br/>
        <h5>${"Energy Transition Progress"}</h5><br/>
        <p>${"Graphs representing Eritrea's progress in transitioning to cleaner energy sources, with a focus on renewable energy adoption and rural electrification."}</p><br/>
        </div>`
      }
      else if(country.id == 72)
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction"}</h3><br/>
        <p>${"Botswana, located in the south of Africa, is a nation with a diverse landscape that includes mountains, deserts, and a stunning coastline along the Red Sea. Despite its natural beauty, Eritrea faces a unique set of environmental challenges that intersect with its history, geography, and development goals."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <h5>${"1. Deforestation and Land Degradation:"}</h5><br/>
        <p>${"Eritrea experiences deforestation primarily due to agricultural expansion, urbanization, and the demand for firewood. This leads to land degradation, soil erosion, and reduced agricultural productivity."}</p><br/>
        <h5>${"2. Water Resource Management:"}</h5><br/>
        <p>${"Access to clean and safe water is a critical concern in Eritrea, especially in rural areas. Uneven distribution, over-extraction of groundwater, and the impacts of climate change contribute to water scarcity and related health issues."}</p><br/>
        <h5>${"3. Marine Resource Conservation:"}</h5><br/>
        <p>${"Eritrea's Red Sea coastline is rich in marine biodiversity and potential for fisheries. However, unsustainable fishing practices, pollution, and climate change pose threats to these valuable resources."}</p><br/>
        <h5>${"4. Energy Access and Sustainability:"}</h5><br/>
        <p>${"Access to modern energy sources is limited in Eritrea, particularly in rural areas. Dependence on traditional biomass fuels contributes to deforestation and indoor air pollution. The nation aims to expand access to sustainable energy."}</p><br/>
        <h3>${"Pressing Issue: Deforestation and Land Degradation"}</h3><br/>
        <p>${"Among Eritrea's environmental challenges, deforestation and land degradation are pressing concerns. Unsustainable land-use practices, coupled with population growth and urbanization, have led to significant deforestation. This not only impacts forests but also exacerbates soil erosion, affecting agricultural productivity and rural livelihoods."}</p><br/>
        <h3>${"Graphs and Satellite Images:"}</h3><br/>
        <h5>${"Deforestation Trends"}</h5><br/>
        <p>${"A graph illustrating trends in deforestation rates over the past decade, highlighting regional disparities and areas most affected."}</p><br/>
        <h5>${"Water Scarcity Map"}</h5><br/>
        <p>${"A satellite image showcasing variations in water scarcity across Eritrea, pinpointing areas most impacted by limited access to clean water."}</p><br/>
        <h5>${"Marine Conservation Challenges"}</h5><br/>
        <p>${"Visual representations of threats to Eritrea's marine resources, including overfishing and pollution, highlighting areas most affected."}</p><br/>
        <h5>${"Energy Transition Progress"}</h5><br/>
        <p>${"Graphs representing Eritrea's progress in transitioning to cleaner energy sources, with a focus on renewable energy adoption and rural electrification."}</p><br/>
        </div>`
      }
      else if(country.id == 24)
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction"}</h3><br/>
        <p>${"Angola, located in the south of Africa, is a nation with a diverse landscape that includes mountains, deserts, and a stunning coastline along the Red Sea. Despite its natural beauty, Eritrea faces a unique set of environmental challenges that intersect with its history, geography, and development goals."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <h5>${"1. Deforestation and Land Degradation:"}</h5><br/>
        <p>${"Eritrea experiences deforestation primarily due to agricultural expansion, urbanization, and the demand for firewood. This leads to land degradation, soil erosion, and reduced agricultural productivity."}</p><br/>
        <h5>${"2. Water Resource Management:"}</h5><br/>
        <p>${"Access to clean and safe water is a critical concern in Eritrea, especially in rural areas. Uneven distribution, over-extraction of groundwater, and the impacts of climate change contribute to water scarcity and related health issues."}</p><br/>
        <h5>${"3. Marine Resource Conservation:"}</h5><br/>
        <p>${"Eritrea's Red Sea coastline is rich in marine biodiversity and potential for fisheries. However, unsustainable fishing practices, pollution, and climate change pose threats to these valuable resources."}</p><br/>
        <h5>${"4. Energy Access and Sustainability:"}</h5><br/>
        <p>${"Access to modern energy sources is limited in Eritrea, particularly in rural areas. Dependence on traditional biomass fuels contributes to deforestation and indoor air pollution. The nation aims to expand access to sustainable energy."}</p><br/>
        <h3>${"Pressing Issue: Deforestation and Land Degradation"}</h3><br/>
        <p>${"Among Eritrea's environmental challenges, deforestation and land degradation are pressing concerns. Unsustainable land-use practices, coupled with population growth and urbanization, have led to significant deforestation. This not only impacts forests but also exacerbates soil erosion, affecting agricultural productivity and rural livelihoods."}</p><br/>
        <h3>${"Graphs and Satellite Images:"}</h3><br/>
        <a href="https://www.google.com/url?sa=i&url=http%3A%2F%2Fwww.luanda.climatemps.com%2Fgraph.php&psig=AOvVaw0IfQ24JOsnoXPZvy8ANbKf&ust=1699946864519000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCKCE7tm5wIIDFQAAAAAdAAAAABAE">
        <img src="angola1.png" alt="Description of the image" width="80%">
        </a><br/>
        <a href="https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.researchgate.net%2Ffigure%2FUrban-population-growth-Angola_fig1_260058505&psig=AOvVaw0IfQ24JOsnoXPZvy8ANbKf&ust=1699946864519000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCKCE7tm5wIIDFQAAAAAdAAAAABAR">
        <img src="angola2.png" alt="Description of the image" width="80%">
        </a><br/>
        <h5>${"Deforestation Trends"}</h5><br/>
        <p>${"A graph illustrating trends in deforestation rates over the past decade, highlighting regional disparities and areas most affected."}</p><br/>
        <h5>${"Water Scarcity Map"}</h5><br/>
        <p>${"A satellite image showcasing variations in water scarcity across Eritrea, pinpointing areas most impacted by limited access to clean water."}</p><br/>
        <h5>${"Marine Conservation Challenges"}</h5><br/>
        <p>${"Visual representations of threats to Eritrea's marine resources, including overfishing and pollution, highlighting areas most affected."}</p><br/>
        <h5>${"Energy Transition Progress"}</h5><br/>
        <p>${"Graphs representing Eritrea's progress in transitioning to cleaner energy sources, with a focus on renewable energy adoption and rural electrification."}</p><br/>
        </div>`
      }
      else if(country.id == 516)
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction"}</h3>
        <p>${"Namibia, located in South Africa, is a land of astonishing ecological diversity. Its expansive landscapes, from the rolling savannas of the Maasai Mara to the towering peaks of Mount Kenya, house a plethora of wildlife and ecosystems. However, beneath this natural splendor lies a complex tapestry of environmental challenges that Kenya faces as it strives for development and conservation."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <h5>${"1. Poverty and Food Insecurity:"}</h5><br/>
        <p>${"A significant portion of Kenya's population grapples with poverty, particularly in rural areas. This dire economic situation intersects with food insecurity. The impacts of climate change, characterized by erratic rainfall and prolonged droughts, have left many vulnerable. Small-scale farmers and marginalized communities often bear the brunt, struggling to secure their next meal."}</p><br/>
        <h5>${"2. Water Scarcity:"}</h5><br/>
        <p>${"Kenya's water resources are unevenly distributed, with arid and semi-arid regions enduring chronic water scarcity. Access to clean, safe drinking water is a daily challenge for many, and the agricultural sector, a backbone of Kenya's economy, suffers due to irregular and inadequate water supplies."}</p><br/>
        <h5>${"3. Wildlife Exploitation:"}</h5><br/>
        <p>${"Kenya's wildlife is celebrated worldwide, yet it faces relentless threats. Poaching, driven by demand for ivory and other illegal wildlife products, poses a grave risk to iconic species like elephants and rhinoceroses. Illegal wildlife trade networks operate across borders, fueling this trade. Conservation efforts are critical to protect these creatures and safeguard the tourism industry, a significant contributor to Kenya's economy."}</p><br/>
        <h5>${"4. Deforestation:"}</h5><br/>
        <p>${"Unchecked deforestation, propelled by expanding agriculture, logging, and infrastructure development, is contributing to soil erosion, habitat loss, and increased greenhouse gas emissions. Forested areas are rapidly shrinking, compromising biodiversity and the crucial role forests play in regulating the climate."}</p><br/>
        <h3>${"Pressing Issue: Wildlife Conservation"}</h3><br/>
        <p>${"Among these pressing environmental challenges, wildlife conservation emerges as a paramount concern. Kenya's unique ecosystems, such as the Maasai Mara and Amboseli National Park, serve as global biodiversity hotspots. The conservation of these habitats and their charismatic inhabitants, like lions and giraffes, isn't just an ethical imperative but also a linchpin of Kenya's economy. Wildlife tourism draws visitors from across the globe, bolstering revenue and creating employment opportunities."}</p><br/>
        <h3>${"Graphs and Satellite Images:"}</h3><br/>
        <a href="https://www.google.com/url?sa=i&url=http%3A%2F%2Fwww.windhoek.climatemps.com%2Fgraph.php&psig=AOvVaw3LcZBTaMK2YYHiElFduPvj&ust=1699947033030000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCOjRgKq6wIIDFQAAAAAdAAAAABAE">
        <img src="namibia1.png" alt="Description of the image" width="80%">
        </a><br/>
        <a href="https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.safaribookings.com%2Fnamibia%2Fclimate&psig=AOvVaw3LcZBTaMK2YYHiElFduPvj&ust=1699947033030000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCOjRgKq6wIIDFQAAAAAdAAAAABAh">
        <img src="namibia2.png" alt="Description of the image" width="80%">
        </a><br/>
        <h5>${"Poverty and Food Insecurity Trends"}</h5><br/>
        <p>${"A line graph depicting trends in poverty rates and food insecurity over the past decade, highlighting variations and correlations."}</p><br/>
        <h5>${"Water Scarcity Map"}</h5><br/>
        <p>${"A satellite image pinpointing water scarcity hotspots in Kenya, emphasizing regions most affected by this critical issue."}</p><br/>
        <h5>${"Deforestation Patterns"}</h5><br/>
        <p>${"A series of satellite images showcasing the patterns of deforestation in Kenya over the years, underscoring the extent of forest loss."}</p><br/>
        <h5>${"Wildlife Conservation Impact"}</h5><br/>
        <p>${"Graphs illustrating the outcomes of wildlife conservation efforts, including changes in poaching incidents and wildlife population trends."}</p><br/>
        <p>${"These visuals and information provide a comprehensive overview of Kenya's intricate environmental landscape. They exemplify our dedication to gaining a profound understanding of the challenges Kenya faces and our commitment to formulating strategies that harmonize development and conservation. Our aspiration is for Kenya to maintain its rich natural heritage,alleviate the impacts of poverty, and fosterenvironmental sustainability."}       
        </div>`
      }
      current2
        .html(str)
    }
    currentCountry = c;
    render();
  }

  function getCountry(event) {
    var pos = projection.invert(d3.mouse(event));
    return countries.features.find(function (f) {
      return f.geometry.coordinates.find(function (c1) {
        return (
          polygonContains(c1, pos) ||
          c1.find(function (c2) {
            return polygonContains(c2, pos);
          })
        );
      });
    });
  }

  //
  // Initialization
  //

  setAngles();

  canvas
    .call(
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    )
    .on("mousemove", mousemove)
    .on("click", handleClick);

  loadData(function (world, cList) {
    land = topojson.feature(world, world.objects.land);
    countries = topojson.feature(world, world.objects.countries);
    // console.log(countries);
    countryList = colist;
    console.log(countryList);
    for (let x of countryList) {
      countryMap[Number(x.id)] = x.name;
    }

    // console.log(countryMap);
    window.addEventListener("resize", scale);
    scale();
    autorotate = d3.timer(rotate);
  });
}
loadGlobe();
