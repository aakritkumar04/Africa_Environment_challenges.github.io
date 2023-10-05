
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
  var rotationDelay = 5000;
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
        return parseInt(co.id, 10) === parseInt(c.id, 10);
      });
      // console.log(country)
      // here will be the code for the box we have to make
      let str = `<h1>${country.name}</h1>`;
      if (country.id == 624) {
        str += `<div><p>${"Guinea-Bissau, one of the world's poorest and most fragile countries, has a population of about 1.9 million.Guinea-Bissau has a history of political and institutional fragility dating back to its independence from Portugal in 1974."}</p><br/><ol><li>${"2015 - 67%"}</li><li>${"2017 - 66.8%"}</li><li>${"2018 - 64.4%"}</li><li>${"2019 - 63.8%"}</li><li>${"2020 - 66.2% (COVID)"}</li><li>${"2021 - 64.4%"}</li><li>${"2022 - 66.9% (due to weaker growth in per captia GDP)"}</li></ol></div>`
        str += `<div><h3>${"World Bank Engagement in Guinea-Bissau"}</h1><br/>
        <p>${"The World Bank Group engagement in Guinea-Bissau is guided by a Country Partnership Framework (CPF) reassessed through PLR approved in July 2021, and that extended the CPF period from FY 21 to FY 23. The revised CPF (FY18-23) has two focus areas:"}</p>
        <br/>
        <ol>
        <li>
        ${"Expand economic opportunities and enhance resilience; and"}
        </li>
        <li>
        ${"Bolster human capital through improved education, health and social protection."}
        </li>
        </ol>
        <p>${"The most recent Systematic Country Diagnostic identified several interconnected binding constraints to sustainably reducing poverty and increasing shared prosperity, including:"}</p>
        <ul>
        <li>
        ${"Lack of inclusiveness and low rural productivity."}
        </li>
        <li>
        ${"Low and unstable economic growth."}
        </li>
        <li>
        ${"Fragility and weak governance."}
        </li>
        </ul>
        <h4>${'Exploitation'}</h4>
        <br/>
        <p>${'Traffickers exploit Bissau-Guinean girls in domestic servitude and in sex trafficking in bars, nightclubs, and hotels in Bissau. Women in commercial sex and children in the Bijagos, an archipelago largely devoid of government and law enforcement presence, are vulnerable to sex trafficking.'}</p>
        <br/>
        <h4>${'Dumping'}</h4>
        <br/>
        <p>${'Landfills: These are controlled areas designated for the disposal of solid waste. Landfills are designed to minimize environmental impacts, and modern landfills include measures to prevent contamination of soil and groundwater. However, in many developing countries, including Guinea-Bissau, some landfills may not meet international standards, leading to environmental and health concerns.'}</p><br/>
        <p>${'Open Dumps: In some areas, especially in rural and less developed regions, open dumps may exist. These are informal and unregulated dumping sites where waste is disposed of without proper management or environmental safeguards. Open dumps can lead to pollution and health hazards.'}</p>
        <p>${"Dumping in Water Bodies: In some cases, waste may be dumped directly into rivers, streams, or other water bodies, which can lead to water pollution and harm aquatic ecosystems."}</p>
        <p>${"Illegal Dumping: Unfortunately, illegal dumping can occur in many areas where waste is discarded in unauthorized locations, such as empty lots, roadsides, or natural areas."}</p>
        </div>`
      }
      else if (country.id == 694) {
        str += `<div><h3>${"World Bank Engagement in Sierra Leone"}</h3><br/><h2>${"Helping Women Farmers:"}</h2><br/>
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
        </div>`
      }
      else if(country.id == 716)
      {
        str+=`<div>
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
          <h3>${"Introduction"}</h3><br/>
          <p>${"Mozambique is situated on the southeastern coast of Africa, bordered by Tanzania to the north, Malawi, Zambia, and Zimbabwe to the northwest, South Africa and Eswatini to the southwest, and the Indian Ocean to the east. The country has a long coastline along the Indian Ocean, which stretches for approximately 1,600 kilometers (994 miles)."}</p>
          <br/>
          <ol><li>${" High Poverty Rates: Mozambique is one of the world's poorest countries, with a large percentage of its population living below the poverty line. According to data available up to my knowledge cutoff datein September 2021, a substantial portion of the population lived in poverty, with many living on less than $1.90 per day, which is the international poverty line defined by the World Bank."}</li><li>${"Rural-Urban Disparities: Poverty in Mozambique is often more acute in rural areas than in urban centers. Many rural communities rely on subsistence farming and face challenges such as limited access to healthcare, education, and infrastructure."}</li><li>${"Impact of Armed Conflict: Mozambique has a history of armed conflict and civil war, which has contributed to poverty and underdevelopment. Conflicts disrupt economic activities, displace communities, and divert resources away from development efforts."}</li><li>${"Agriculture-Based Economy: The country's economy is heavily reliant on agriculture, which is vulnerable to climate-related challenges, such as droughts and floods. These events can have a devastating impact on rural livelihoods and contribute to poverty."}</li><li>${"Limited Access to Education and Healthcare: Access to education and healthcare services is limited, particularly in rural areas. This can hinder human capital development and perpetuate the cycle of poverty."}</li><li>${"Inequality: Income and wealth inequality are significant issues in Mozambique, with a small portion of the population holding a disproportionate share of the country's resources and wealth."}</li><li>${"Natural Disasters: Mozambique is susceptible to natural disasters, including cyclones and flooding, which can lead to loss of life, displacement, and destruction of infrastructure, further exacerbating poverty."}</li></ol>
        </div>`
      }
      else if(colorCountry.id == 454)
      {
        str+=`<div>
          <p>${"Agriculture and Subsistence Farming: The majority of Malawi's population relies on agriculture, mainly subsistence farming, for their livelihoods. While agriculture is essential for food security and income generation, unsustainable farming practices like deforestation for land clearance and inadequate soil conservation can lead to soil erosion and land degradation, making it difficult for farmers to escape poverty."}</p><br/>
          <p>${"Deforestation: Malawi has experienced significant deforestation due to logging, charcoal production, and land clearing for agriculture. This has detrimental effects on the environment, leading to soil erosion, loss of biodiversity, and reduced water quality. Poor rural communities often rely on forests for fuelwood and other resources, so deforestation impacts their daily lives."}</p><br/>
          
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
