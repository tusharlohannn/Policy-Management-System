document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const usersContainer = document.getElementById('usersContainer');
  const addNewUserButton = document.getElementById('addNewUserButton');
  const addUserForm = document.getElementById('addUserForm');
  const addUserCloseButton = document.getElementById('addUserCloseButton');
  const addUserSaveButton = document.getElementById('addUserSaveButton');
  const addUserIdInput = document.getElementById('addUserId');
  const addUserPasswordInput = document.getElementById('addUserPassword');
  const editUserForm = document.getElementById('editUserForm');
  const editUserCloseButton = document.getElementById('editUserCloseButton');
  const editUserSaveButton = document.getElementById('editUserSaveButton');

  if (!token) {
    window.location.href = '/';
    return;
  }

  fetchUsers();

  function fetchUsers() {
    fetch('/usersList', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(users => {
      usersContainer.innerHTML = '';
      users.forEach(user => {
        const card = document.createElement('div');
        card.dataset.id = user.id;
        card.innerHTML = `
          <div class="userCard">
              <div style="margin:auto 0;">
                  <img src="./images/userThumbnail.png">
              </div>
              <div class="userCardText">
                  <p>UserID: ${user.id}</p>
                  <p>UserName: ${user.userName || 'N/A'}</p>
                  <div class="actionButtonsDiv">
                      <button class="editButton" data-id="${user.id}">Edit</button>
                      <button class="deleteButton" data-id="${user.id}">Delete</button>
                  </div>
              </div>
          </div>
        `;
        usersContainer.appendChild(card);
      });

      document.querySelectorAll('.editButton').forEach(button => {
        button.addEventListener('click', handleEdit);
      });

      document.querySelectorAll('.deleteButton').forEach(button => {
        button.addEventListener('click', handleDelete);
      });
    })
    .catch(err => console.error('Error fetching users:', err));
  }

  addNewUserButton.addEventListener('click', () => {
    addUserForm.style.display = 'block';
    usersContainer.classList.add('blur');
  });

  addUserCloseButton.addEventListener('click', () => {
    closeAddUserForm();
  });

  addUserSaveButton.addEventListener('click', () => {
    const username = addUserIdInput.value;
    const password = addUserPasswordInput.value;
    if (!username || !password) {
      alert('Please fill out both fields.');
      return;
    }

    const newUser = {
      username: username,
      password: password
    };

    fetch('/usersList', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newUser)
    })
    .then(response => response.json())
    .then(result => {
      if (result.message === 'User added successfully') {
        fetchUsers(); 
        closeAddUserForm();
      } else {
        console.error(result.error);
        alert('Error adding user: ' + result.error);
      }
    })
    .catch(err => {
      console.error('Error adding user:', err);
      alert('Error adding user. Please try again.');
    });
  });

  function closeAddUserForm() {
    addUserForm.style.display = 'none';
    usersContainer.classList.remove('blur');
    addUserIdInput.value = '';
    addUserPasswordInput.value = '';
  }

  function handleEdit(event) {
    const userId = event.target.dataset.id;
    fetch(`/usersList/${userId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(user => {
        document.getElementById('editUserId').value = user.id;
        document.getElementById('editUserUsername').value = user.userName;
        document.getElementById('editUserPassword').value = user.password;
        document.getElementById('editUserForm').style.display = 'block';
        usersContainer.classList.add('blur');
    })
    .catch(err => console.error('Error fetching user:', err));
}

editUserSaveButton.addEventListener('click', () => {
  const userId = document.getElementById('editUserId').value;
  const newUserName = document.getElementById('editUserUsername').value;
  const newPassword = document.getElementById('editUserPassword').value;

  if (!newUserName || !newPassword) {
    alert('Username and password cannot be empty.');
    return;
  }

  const updatedUser = {
      userName: newUserName,
      password: newPassword
  };

  fetch(`/usersList/${userId}`, {
      method: 'PUT',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedUser)
  })
  .then(response => response.json())
  .then(result => {
      if (result.message === 'User updated successfully') {
          fetchUsers();
          closeEditUserForm();
      } else {
          console.error(result.error);
          alert('Error updating user: ' + result.error);
      }
  })
  .catch(err => {
      console.error('Error updating user:', err);
      alert('Error updating user. Please try again.');
  });
});

editUserCloseButton.addEventListener('click', closeEditUserForm);
document.getElementById('deleteUserCloseButton').addEventListener('click', closeDeleteUserForm);

function closeDeleteUserForm(){
  usersContainer.classList.remove('blur');
  document.getElementById('deleteUserForm').style.display = 'none';
}

function closeEditUserForm() {
  usersContainer.classList.remove('blur');
  document.getElementById('editUserForm').style.display = 'none';
  document.getElementById('editUserUsername').value = '';
  document.getElementById('editUserPassword').value = '';
}

document.getElementById('logoutButton').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  window.location.href = '../index.html';
});



  function handleDelete(event) {
    document.getElementById('deleteUserForm').style.display = 'block';
    usersContainer.classList.add('blur');
    document.getElementById('deleteUserSaveButton').addEventListener('click', () =>{
      const userIdToDelete = event.target.dataset.id;
      fetch(`/usersList/${userIdToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.json())
      .then(result => {
        if (result.message === 'User deleted successfully') {
          fetchUsers();
          closeDeleteUserForm();
        } else {
          console.error(result.error);
        }
      })
      .catch(err => console.error('Error deleting user:', err));
    })
  }
});
