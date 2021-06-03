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
    },

    "*trash*" : {
      name: 'trash',
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

function trashFolder(name, root) {
  var folder = stringToFolder(name, root);
  deleteFolder(name, root);

  folder.origin = name;

  root.children['*trash*'].children[folder.name + Date.now()] = folder;
}

function unTrashFolder(name, root) {
  console.log(name);
  var folder = stringToFolder(name, root);
  deleteFolder(name, root);
  while(folderExists(folder.origin, root)) {
    folder.origin += '_';
  }
  addFolder(folder.origin, root);
  var restoredFolder = stringToFolder(folder.origin, root);
  for(var child in folder.children) {
    addFolder(folder.children[child], restoredFolder);
  }
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

function getNameRelativeTo(folder, parent) {
  for(let child in parent.children) {
    if(Object.is(parent.children[child], folder)) {
      return child;
    }
  }

  for(let child in parent.children) {
    var res = getNameRelativeTo(folder, parent.children[child]);
    if(res) return child + '/' + res;
  }
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

function requestTrashFolder() {
  var folderName = window.prompt('Enter folder to trash');
  trashFolder(folderName, folderTree);
  refreshView();
}

function requestUnTrashFolder(folderName) {
  unTrashFolder(folderName, folderTree);
  refreshView();
}

var parentUl = document.getElementById('json');
function refreshView() {
  parentUl.innerHTML = '';

  function makeList(ul, tree, isTrash) {
    for(let node in tree.children) {
      var li = document.createElement('LI');
      if(isTrash)
        li.innerHTML = '<a href="#" onclick="requestUnTrashFolder(\'' + getNameRelativeTo(tree.children[node], folderTree) + '\')">' + tree.children[node].name + '</a>';
      else
        li.innerText = tree.children[node].name;
      ul.appendChild(li);
      if(Object.keys(tree.children[node].children).length > 0) {
        var childUl = document.createElement('UL');
        makeList(childUl, tree.children[node], tree.children[node].name === 'trash');
        ul.appendChild(childUl);
      }
    }
  }

  makeList(parentUl, folderTree);
}
refreshView();
