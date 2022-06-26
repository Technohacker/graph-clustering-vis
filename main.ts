import cytoscape, { Collection, EdgeSingular, Position } from "cytoscape";

import { Chance } from "chance";
import { dbg, dist } from "./util";

const TIME = 1000;

const ch = new Chance();

const cy = cytoscape({
  container: document.querySelector("#graph") as HTMLElement,
  style: [
    // the stylesheet for the graph
    {
      selector: "node",
      style: {
        "background-color": "#666",
        color: "white",
        label: "data(id)",
      },
    },
    {
      selector: "node:selected",
      style: {
        "background-color": "data(highlight)",
      },
    },
    {
      selector: "edge",
      style: {
        width: 1,
        "line-color": "#555",
      },
    },
    {
      selector: "edge:selected",
      style: {
        width: 3,
        "line-color": "data(highlight)",
      },
    },
  ],
  minZoom: 0.01,
  maxZoom: 2.0,
  layout: {
    name: "grid",
    rows: 1,
  },
  wheelSensitivity: 0.25,
  motionBlur: true,
});

function addNode(position: Position) {
  let id = ch.word({ syllables: 2, capitalize: true });
  cy.add({
    position,
    data: {
      id,
    },
  });

  cy.nodes().forEach((x) => {
    if (x.data("id") === id || dist(position, x.position()) > 500) {
      return;
    }

    cy.add({
      data: {
        source: id,
        target: x.data("id"),
      },
    });
  });
}

cy.on("tap", (e) => addNode(e.position));
cy.on("cxttap", (e) => cy.elements().unselect());

document.querySelector("button#fill")?.addEventListener("click", () => {
  const n = 100;
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      addNode({
        x: ch.floating({ min: 0, max: 1800 }),
        y: ch.floating({ min: 0, max: 1800 }),
      });
    }, i * (TIME / n));
  }
});

document.querySelector("button#mst")?.addEventListener("click", () => {
  cy.elements().unselect();
  let mst = cy.elements().kruskal((edges) => {
    let edge = edges as EdgeSingular;

    return dist(edge.source().position(), edge.target().position());
  });

  // show order via animations
  var duration = TIME / cy.nodes().length;
  mst.edges()
  .sort((a, b) => {
    return (
      dist(b.source().position(), b.target().position()) -
      dist(a.source().position(), a.target().position())
    );
  }).forEach((edge, i) => {
    edge.delay(i * duration).animate(
      {
        step() {
          edge.union(edge.connectedNodes()).forEach((e) => {
            e.select();
            e.data("highlight", "red");
          });
        },
      },
      { duration: duration }
    );
  });
});

document.querySelector("button#mstCluster")?.addEventListener("click", () => {
  cy.elements().unselect();
  let mst = cy.elements().kruskal((edges) => {
    let edge = edges as EdgeSingular;

    return dist(edge.source().position(), edge.target().position());
  });

  let thresh = parseInt((document.querySelector("input#mstThresh") as HTMLInputElement)
    .value, 10);
  let edge_filter = mst
    .edges()
    .sort((a, b) => {
      return (
        dist(b.source().position(), b.target().position()) -
        dist(a.source().position(), a.target().position())
      );
    })
    .filter((_, i) => i > thresh);
  let components = edge_filter.union(edge_filter.connectedNodes()).components();

  components.forEach((c) => {
    // console.log(e.isEdge());
    const col = ch.color({ format: "rgb" });

    c.forEach((e) => {
      e.union(e.edgesTo(c)).forEach((f) => {
        f.data("highlight", col);
        f.select();
      });
    });
  });
});

document.querySelector("button#hca")?.addEventListener("click", () => {
  cy.elements().unselect();
  let groups: Array<Collection> = cy.nodes().hca({
    threshold: parseInt((document.querySelector("input#hcaThresh") as HTMLInputElement)
      .value, 10),
    attributes: [(node) => node.position().x, (node) => node.position().y],
  });

  groups.forEach((c) => {
    const col = ch.color({ format: "rgb" });

    c.forEach((e) => {
      e.union(e.edgesTo(c)).forEach((f) => {
        f.data("highlight", col);
        f.select();
      });
    });
  });
});
