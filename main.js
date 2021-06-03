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

/**
 * Adds a folder to another
 * @param name <string : folder> the directory of the folder to add relative to
 *              the parent, or a folder to directly attach to the parent.
 * @param parent <folder> a folder that is a parent to the new folder (not
                necessarily the immediate parent).
 */
function addFolder(name, parent) {
  if(typeof name === 'string') {
    var fragments = name.split('/');
    var immediateParent = fragments.slice(0, fragments.length - 1).join('/');

    // add missing parents of the folder, if any
    if(immediateParent != '' && !folderExists(immediateParent, parent)) {
      addFolder(immediateParent, parent);
    }

    // navigate to the immediate parent of the folder and attach it to its children
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
    // if we were passed a folder object, directly attach it to the parent
    parent.children[name.name] = name;
  }
}

/**
 * Deletes a folder from its parent
 * @param name <string> the directory of the folder to add relative to the parent.
 * @param parent <folder> a folder that is a parent to the folder (not
                necessarily the immediate parent).
 */
function deleteFolder(name, parent) {
  var fragments = name.split('/');
  var immediateParent = fragments.slice(0, fragments.length - 1).join('/');

  if(immediateParent == '') {
    // delete top-level folders right away
    delete parent.children[name];
  } else if(folderExists(immediateParent, parent)) {
    // navigate to the immediate parent of the folder, if it exists, and then delete
    // this folder from its children prop
    var folder = parent;
    var simpleName = fragments.pop();
    for(var fragment of fragments) {
      folder = folder.children[fragment];
    }
    delete folder.children[simpleName];
  }
}

/**
 * Moves a folder to another folder.
 * @param source <string> the directory of the source folder relative to the parent.
 * @param source <string> the directory of the dest folder relative to the parent.
 * @param parent <folder> a folder that is a parent to both the source and dest
                  (not necessarily the immediate parent).
 */
function moveFolder(source, destination, parent) {
  // We get the folder objects from the directory so we continue to hold
  // a reference to them after they are removed from the parent's tree
  var sourceFolder = stringToFolder(source, folderTree);
  var destinationFolder = stringToFolder(destination, folderTree);

  // Calculate the directory of the destination relative to the source and check
  // if it is a subfolder. If so, we do not continue with the move op as it'd result
  // in a cyclic move.
  var dFragments = destination.split('/');
  var sFragments = source.split('/');
  var dRelativeToS = dFragments.slice(sFragments.length).join('/');
  if(folderExists(dRelativeToS, sourceFolder)) {
    alert('Cannot move into a destination that is inside the source');
    return;
  }

  // We don't move if the source and destination are the same to prevent cyclic
  // move ops.
  if(source === destination) {
    alert('Source and destination cannot be the same');
    return;
  }

  // Conflicting names receive a numeric suffix to uniqify.
  // TODO: find a better solution as this one has several bugs.
  // An ideal solution could be achieved in conjunction with asking the user to rename the
  // affected folders
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

  // Remove the source from the parent tree and add it to the destination
  deleteFolder(source, parent);
  addFolder(sourceFolder, destinationFolder);
}

/**
 * Moves a folder to "trash".
 * @param name <string> the directory of the source folder relative to the root folder.
 * @param root <folder> the top-level folder that contains the *trash* folder.
 */
function trashFolder(name, root) {
  // We remove the folder from wherever it currently is and move it to the trash folder
  var folder = stringToFolder(name, root);
  deleteFolder(name, root);

  folder.origin = name;

  // We also append the current timestamp to uniquely identify it in case of name
  // conflicts. Note that more identifying info is present in the 'origin' prop
  root.children['*trash*'].children[folder.name + Date.now()] = folder;
}

/**
 * Moves a folder from trash back to its original location.
 * @param name <string> the directory of the folder in trash, relative to root.
 * @param root <folder> the top-level folder that contains the *trash* folder.
 */
function unTrashFolder(name, root) {
  // We get the folder object currently sitting in trash and remove it from there
  var folder = stringToFolder(name, root);
  deleteFolder(name, root);

  // If a folder with the same name exists in its original directory, we attempt
  // to uniqify the name. A better solution would be to work with the user in finding
  // a unique name
  while(folderExists(folder.origin, root)) {
    folder.origin += '_';
  }

  // Create a brand new folder in the location where the trashed one was
  // Then, we attach to it all its subfolder objects
  addFolder(folder.origin, root);
  var restoredFolder = stringToFolder(folder.origin, root);
  for(var child in folder.children) {
    addFolder(folder.children[child], restoredFolder);
  }
}

/**
 * Returns the first folder that matches the simple name provided.
 * @param name <string> the name of the folder to find. This is NOT the full path
                of the folder, rather just its simple name.
 * @param parent <folder> a folder that is a parent to the folder to find (not
                necessarily the immediate parent).
 * @return a folder object if it matches the name, null otherwise.
 */
function findFolder(name, parent) {
  // We look through all children of the parent recursively and return
  // the first matching one.
  for(var folder in parent.children) {
    var subFolder = parent.children[folder];
    if(name == folder) return subFolder;
    if(Object.keys(subFolder.children).length > 0) return findFolder(name, subFolder);
  }
  return null;
}

/**
 * Returns a folder object based on the passed path.
 * @param name <string> the path of the folder relative to the parent prop.
 * @param parent <folder> a folder that is a parent to the folder to find (not
                necessarily the immediate parent).
 * @return a folder object if it matches the name, null otherwise.
 */
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
  return null;
}

/**
 * Checks if a folder given by its path exists.
 * @param name <string> the path of the folder relative to the parent prop.
 * @param parent <folder> a folder that is a parent to the folder to find (not
                necessarily the immediate parent).
 * @return true if the folder exists, false otherwise.
 */
function folderExists(name, parent) {
  var folder = parent;
  for(var fragment of name.split('/')) {
    folder = folder.children[fragment];
    if(folder === undefined) return false;
  }
  return true;
}

/**
 * Returns the name of a folder relative to the parent prop.
 * @param folder <folder> the folder object that is a part of the parent's tree.
 * @param parent <folder> the folder relative to which the path has to be generated.
 * @return the relative path of the folder object.
 */
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

/******************************************************************************/
/** UI-specific functions, not relevant to operation of the folder system **/
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
