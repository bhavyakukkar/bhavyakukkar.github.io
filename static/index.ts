let path: string[] = [];

function main() {
  updatePath();
}

function updatePath() {
  path = window.location.hash.substring(1).split("/").filter(p => p);
  console.log(path);
  // if (paths[])
}

window.addEventListener('hashchange', updatePath);

document.addEventListener('DOMContentLoaded', () => {
  main();
});
