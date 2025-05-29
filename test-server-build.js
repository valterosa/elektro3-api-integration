// Test server build imports
import * as serverBuild from "./build/server/index.js";

console.log("Server build properties:");
console.log("- routes:", typeof serverBuild.routes, serverBuild.routes ? Object.keys(serverBuild.routes).length : "null/undefined");
console.log("- entry:", typeof serverBuild.entry);
console.log("- assets:", typeof serverBuild.assets);
console.log("- All exports:", Object.keys(serverBuild));

// Test if routes is properly structured
if (serverBuild.routes) {
  console.log("Sample routes:", Object.keys(serverBuild.routes).slice(0, 5));
} else {
  console.log("ERROR: routes is", serverBuild.routes);
}
