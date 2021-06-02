/*
folder : {
  name : string;
  children: {f: folder_f, ...};

}
*/

folderTree = {
  name: 'root',
  children: {
    f1: {
      name: 'f1',
      children: {}
    }
  }
};

function addFolder(name, parent) {
  if(typeof name === 'string') {
    var fragments = name.split('/');
    var immediateParent = fragments.slice(0, fragments.length - 1).join('/');

    if(immediateParent != '' && !folderExists(immediateParent, parent)) {
      addFolder(immediateParent, parent);
    }

    var folder = parent;
    for(var fragment of fragments.slice(0, fragments.length - 1)) {
      folder = folder.children[fragment];
    }

    var simpleName = fragments.pop();
    folder.children[simpleName] = {
      name: simpleName,
      children: {}
    }
  } else {
    parent.children[name.name] = name;
  }
}

function deleteFolder(name, parent) {
  var fragments = name.split('/');
  var immediateParent = fragments.slice(0, fragments.length - 1).join('/');
  if(immediateParent == '') {
    delete parent.children[name];
  } else if(folderExists(immediateParent, parent)) {
    var folder = parent;
    var simpleName = fragments.pop();
    for(var fragment of fragments) {
      folder = folder.children[fragment];
    }
    delete folder.children[simpleName];
  }
}

function moveFolder(source, destination, parent) {
  var sourceFolder = stringToFolder(source, folderTree);
  var destinationFolder = stringToFolder(destination, folderTree);

  var dFragments = destination.split('/');
  var sFragments = source.split('/');
  var dRelativeToS = dFragments.slice(sFragments.length).join('/');
  if(folderExists(dRelativeToS, sourceFolder)) {
    alert('Cannot move into a destination that is inside the source');
    return;
  }

  if(source === destination) {
    alert('Source and destination cannot be the same');
    return;
  }

  var conflictingNames = false;
  var increment = 0;
  
  do {
    for(var childFolderInDest in destinationFolder.children) {
      if(childFolderInDest == sourceFolder.name) {
        conflictingNames = true;
        increment++;
      }
    }
    conflictingNames = false;
    if(increment > 0)
      sourceFolder.name += '_' + increment;
  } while(conflictingNames);

  deleteFolder(source, parent);
  addFolder(sourceFolder, destinationFolder);
}

function findFolder(name, parent) {
  for(var folder in parent.children) {
    var subFolder = parent.children[folder];
    if(name == folder) return subFolder;
    if(Object.keys(subFolder.children).length > 0) return findFolder(name, subFolder);
  }
  return null;
}

function stringToFolder(name, parent) {
  var fragments = name.split('/');
  var immediateParent = fragments.slice(0, fragments.length - 1).join('/');

  if(immediateParent == '') {
    return parent.children[name];
  } else if(folderExists(name, parent)) {
    var folder = parent;
    for(var fragment of fragments) {
      folder = folder.children[fragment];
    }
    return folder;
  }
}

function folderExists(name, parent) {
  var folder = parent;
  for(var fragment of name.split('/')) {
    folder = folder.children[fragment];
    if(folder === undefined) return false;
  }
  return true;
}

function requestAddFolder() {
  var folderName = window.prompt('Enter folder name');
  addFolder(folderName, folderTree);
  refreshView();
}

function requestDeleteFolder() {
  var folderName = window.prompt('Enter folder name to delete');
  deleteFolder(folderName, folderTree);
  refreshView();
}

function requestMoveFolder() {
  var source = window.prompt('Enter source folder');
  var destination = window.prompt('Enter destination folder');
  moveFolder(source, destination, folderTree);
  refreshView();
}

var parentUl = document.getElementById('json');
function refreshView() {
  parentUl.innerHTML = '';

  function makeList(ul, tree) {
    for(var node in tree.children) {
      var li = document.createElement('LI');
      li.innerText = tree.children[node].name;
      ul.appendChild(li);
      if(Object.keys(tree.children[node].children).length > 0) {
        var childUl = document.createElement('UL');
        makeList(childUl, tree.children[node]);
        ul.appendChild(childUl);
      }
    }
  }

  makeList(parentUl, folderTree);
}
refreshView();
