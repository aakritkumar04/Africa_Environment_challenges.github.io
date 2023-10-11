
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
        str += `<div>
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
        <h5>${"2. Environmental Exploitation:"}</h5><br/>
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
        <h5>${"Poverty and Food Insecurity Trends"}</h5><br/>
        <p>${"A line graph depicting trends in poverty rates and food insecurity over the past decade, highlighting variations and correlations."}</p><br/>
        <h5>${"Water Scarcity Map"}</h5><br/>
        <p>${"A satellite image pinpointing water scarcity hotspots in Kenya, emphasizing regions most affected by this critical issue."}</p><br/>
        <h5>${"Deforestation Patterns"}</h5><br/>
        <p>${"A series of satellite images showcasing the patterns of deforestation in Kenya over the years, underscoring the extent of forest loss."}</p><br/>
        <h5>${"Wildlife Conservation Impact"}</h5><br/>
        <p>${"Graphs illustrating the outcomes of wildlife conservation efforts, including changes in poaching incidents and wildlife population trends."}</p>
        </div>`
      }
      else if(country.id == 706)
      {
        str+=`<div>
        <br/>
        <h3>${"Introduction:"}</h3><br/>
        <p>${"Somalia, located in the Horn of Africa, boasts a diverse landscape ranging from arid deserts to lush coastal regions. Despite its natural beauty, Somalia faces a complex set of environmental challenges that intersect with its socio-economic dynamics and historical conflicts."}</p><br/>
        <h3>${"Environmental Challenges:"}</h3><br/>
        <h5>${"1. Desertification and Land Degradation:"}</h5>
        <p>${"Somalia's arid and semi-arid regions are prone to desertification and land degradation. Overgrazing, deforestation, and unsustainable land-use practices have exacerbated these issues, impacting agricultural productivity and food security."}</p><br/>
        <h5>${"2. Water Resource Scarcity:"}</h5><br/>
        <p>${"Access to clean water is a pressing concern in Somalia, exacerbated by recurrent droughts and limited infrastructure. Unequal distribution, competition for resources, and climate change contribute to water scarcity challenges."}</p><br/>
        <h5>${"3. Coastal Erosion and Marine Conservation:"}</h5><br/>
        <p>${"Somalia's extensive coastline is vulnerable to coastal erosion, exacerbated by factors like climate change and illegal fishing. Protecting marine ecosystems and resources is essential for livelihoods and food security."}</p><br/>
        <h5>${"4. Energy Access and Sustainability:"}</h5><br/>
        <p>${"Access to energy, especially in rural areas, is limited. Dependence on traditional biomass fuels contributes to deforestation and indoor air pollution. Somalia is exploring renewable energy options for sustainability."}</p><br/>
        <h3>${"Pressing Issue: Desertification and Land Degradation"}</h3><br/>
        <p>${"Among Somalia's environmental challenges, desertification and land degradation are pressing issues. Prolonged droughts, coupled with unsustainable land-use practices, have led to the expansion of arid areas and the degradation of fertile land. This affects agriculture and food security, particularly for vulnerable communities."}</p><br/>
        <h3>${"Graphs and Satellite Images:"}</h3><br/>
        <h5>${"Desertification Trends"}</h5><br/>
        <p>${"A graph illustrating trends in desertification and land degradation over the past decade, emphasizing regional disparities and areas most affected."}</p><br/>
        <h5>${"Water Scarcity Map"}</h5><br/>
        <p>${"A satellite image highlighting variations in water scarcity across Somalia, pinpointing areas most impacted by limited access to clean water."}</p><br/>
        <h5>${"Coastal Erosion Patterns"}</h5><br/>
        <p>${"A series of satellite images depicting coastal erosion patterns along Somalia's coastline, emphasizing the challenges faced by coastal communities."}</p><br/>
        <h5>${"Energy Transition Progress"}</h5><br/>
        <p>${"Graphs representing Somalia's progress in transitioning to cleaner energy sources, with a focus on rural electrification and reducing biomass fuel usage."}</p>
        </div>`
      }
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
