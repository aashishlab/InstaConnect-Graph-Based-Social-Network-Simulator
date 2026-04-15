// Preloaded profile images (you can replace with any URLs)
const profileImages = [
  "https://i.pravatar.cc/80?img=1",
  "https://i.pravatar.cc/80?img=2",
  "https://i.pravatar.cc/80?img=3",
  "https://i.pravatar.cc/80?img=4",
  "https://i.pravatar.cc/80?img=5",
];

// Graph data
let nodes = [];
let links = [];

const svg = d3.select("#graph");
const width = window.innerWidth - 260;
const height = window.innerHeight;

svg.attr("width", width).attr("height", height);

// Groups for lines and nodes
const linkGroup = svg.append("g").attr("stroke", "#fff").attr("stroke-opacity", 0.5);
const nodeGroup = svg.append("g");

// Force simulation
const simulation = d3.forceSimulation(nodes)
  .force("link", d3.forceLink(links).id(d => d.id).distance(160))
  .force("charge", d3.forceManyBody().strength(-500))
  .force("center", d3.forceCenter(width / 2, height / 2));

// Add/update the graph
function updateGraph() {
  // Links
  const link = linkGroup.selectAll("line").data(links, d => d.source.id + "-" + d.target.id);
  link.exit().remove();
  link.enter()
    .append("line")
    .attr("stroke-width", 2)
    .attr("stroke", "url(#gradient)")
    .attr("opacity", 0)
    .transition().duration(600).attr("opacity", 1);

  // Nodes
  const node = nodeGroup.selectAll("g").data(nodes, d => d.id);
  const nodeEnter = node.enter().append("g").call(drag(simulation));

  nodeEnter.append("circle")
    .attr("r", 25)
    .attr("fill", d => d.color)
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .attr("opacity", 0)
    .transition()
    .duration(500)
    .attr("opacity", 1);

  nodeEnter.append("clipPath")
    .attr("id", d => "clip-" + d.id)
    .append("circle")
    .attr("r", 23)
    .attr("cx", 0)
    .attr("cy", 0);

  nodeEnter.append("image")
    .attr("xlink:href", d => d.img)
    .attr("width", 46)
    .attr("height", 46)
    .attr("x", -23)
    .attr("y", -23)
    .attr("clip-path", d => `url(#clip-${d.id})`);

  node.exit().remove();

  simulation.nodes(nodes).on("tick", ticked);
  simulation.force("link").links(links);
  simulation.alpha(1).restart();

  function ticked() {
    linkGroup.selectAll("line")
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    nodeGroup.selectAll("g")
      .attr("transform", d => `translate(${d.x},${d.y})`);
  }
}

// Add user
function addUser() {
  const name = document.getElementById("username").value.trim();
  if (!name) return;

  const id = "user" + (nodes.length + 1);
  const colorOptions = ["#ec4899", "#8b5cf6", "#06b6d4", "#f59e0b", "#22c55e"];
  const newNode = {
    id,
    name,
    img: profileImages[nodes.length % profileImages.length],
    color: colorOptions[nodes.length % colorOptions.length],
  };

  nodes.push(newNode);
  updateSelectMenus();
  updateGraph();
  document.getElementById("username").value = "";

  // Pop-in animation
  const circles = nodeGroup.selectAll("circle").nodes();
  const last = circles[circles.length - 1];
  gsap.fromTo(last, { scale: 0 }, { scale: 1, duration: 0.6, ease: "back.out(1.7)" });
}

// Dropdown menus
function updateSelectMenus() {
  const userA = document.getElementById("userA");
  const userB = document.getElementById("userB");
  userA.innerHTML = "";
  userB.innerHTML = "";
  nodes.forEach(node => {
    const optA = document.createElement("option");
    const optB = document.createElement("option");
    optA.value = optB.value = node.id;
    optA.textContent = optB.textContent = node.name;
    userA.appendChild(optA);
    userB.appendChild(optB);
  });
}

// Follow / Unfollow
function followUser() {
  const a = document.getElementById("userA").value;
  const b = document.getElementById("userB").value;
  if (a === b || !a || !b) return;
  if (links.some(l => l.source.id === a && l.target.id === b)) return;

  const source = nodes.find(n => n.id === a);
  const target = nodes.find(n => n.id === b);
  links.push({ source, target });
  updateGraph();

  // Follow animation
  const line = linkGroup.selectAll("line").nodes()[links.length - 1];
  gsap.fromTo(line,
    { stroke: "#22c55e", opacity: 0 },
    { stroke: "#f472b6", opacity: 1, duration: 1, ease: "power2.out" });
}

function unfollowUser() {
  const a = document.getElementById("userA").value;
  const b = document.getElementById("userB").value;
  const index = links.findIndex(l => l.source.id === a && l.target.id === b);
  if (index !== -1) {
    const line = d3.select(linkGroup.selectAll("line").nodes()[index]);
    gsap.to(line.node(), {
      duration: 0.6, stroke: "#ef4444", opacity: 0, onComplete: () => {
        links.splice(index, 1);
        updateGraph();
      }
    });
  }
}

// Dragging
function drag(simulation) {
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }
  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
  return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
}
