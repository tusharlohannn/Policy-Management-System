document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const tableBody = document.querySelector('#policyTable tbody');
  const addPolicyForm = document.getElementById('addPolicyForm');
  const editPolicyForm = document.getElementById('editPolicyForm');
  const deletePolicyForm = document.getElementById('deletePolicyForm');
  const editSaveButton = document.getElementById('editSaveButton');
  const addPolicyButton = document.getElementById('addPolicyButton');
  const deleteSaveButton = document.getElementById('deleteSaveButton');
  const mainContainer = document.getElementById('mainContainer');
  let currentEditingRow = null;
  let policyIdToDelete = null;

  if (!token) {
    window.location.href = '/';
    return;
  }

  document.getElementById('welcomeMessage').textContent = `Welcome, ${username}`;

  fetchPolicies();

  function fetchPolicies() {
    fetch('/policys', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(policies => {
      tableBody.innerHTML = '';
      policies.forEach(policy => {
        const row = document.createElement('tr');
        row.dataset.id = policy.id;
        row.innerHTML = `
          <td>${policy.id}</td>
          <td>${policy.policy_number || 'N/A'}</td>
          <td>${policy.insured_party || 'N/A'}</td>
          <td>${policy.coverage_type || 'N/A'}</td>
          <td>${formatDateForTable(policy.start_date) || 'N/A'}</td>
          <td>${formatDateForTable(policy.end_date) || 'N/A'}</td>
          <td>${policy.premium_amount || 'N/A'}</td>
          <td>${policy.status || 'N/A'}</td>
          <td>
            <div class="actionButtonsDiv">
              <button class="editButton" data-id="${policy.id}"><img src="./images/edit.svg">Edit</button>
              <button class="deleteButton" data-id="${policy.id}"><img src="./images/delete.svg">Delete</button>
            </div>
          </td>
        `;
        tableBody.appendChild(row);
      });

      document.querySelectorAll('.editButton').forEach(button => {
        button.addEventListener('click', handleEdit);
      });

      document.querySelectorAll('.deleteButton').forEach(button => {
        button.addEventListener('click', (event) => {
          policyIdToDelete = event.target.dataset.id;
          deletePolicyForm.style.display = 'block';
          mainContainer.classList.add('blur');
        });
      });
    })
    .catch(err => console.error('Error fetching policies:', err));
  }

  function handleEdit(event) {
    const policyId = event.target.dataset.id;

    fetch(`/policys/${policyId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(policy => {
      document.getElementById('id').value = policy.id;
      document.getElementById('policy_number').value = policy.policy_number || '';
      document.getElementById('insured_party').value = policy.insured_party || '';
      document.getElementById('coverage_type').value = policy.coverage_type || '';
      document.getElementById('start_date').value = formatDateForInput(policy.start_date) || '';
      document.getElementById('end_date').value = formatDateForInput(policy.end_date) || '';
      document.getElementById('premium_amount').value = policy.premium_amount || '';
      document.getElementById('status').value = policy.status || '';
      editPolicyForm.dataset.policyId = policyId;

      editPolicyForm.style.display = 'block';
      mainContainer.classList.add('blur');

      currentEditingRow = event.target.closest('tr');
    })
    .catch(err => console.error('Error fetching policy details:', err));
  }

  function handleDelete(){
    if (!policyIdToDelete) return;

    fetch(`/policys/${policyIdToDelete}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (response.ok) {
        const rowToDelete = document.querySelector(`tr[data-id="${policyIdToDelete}"]`);
        if (rowToDelete) {
          rowToDelete.remove();
        }
        deletePolicyForm.style.display = 'none';
        mainContainer.classList.remove('blur');
        policyIdToDelete = null;
      } else {
        return response.json().then(data => {
          throw new Error(data.message);
        });
      }
    })
    .catch(err => console.error(`Error deleting policy: ${err.message}`));
  };

  editSaveButton.addEventListener('click', (e) => {
    e.preventDefault();
    const policyId = editPolicyForm.dataset.policyId;
    const updatedPolicy = {
      policy_number: document.getElementById('policy_number').value,
      insured_party: document.getElementById('insured_party').value,
      coverage_type: document.getElementById('coverage_type').value,
      start_date: document.getElementById('start_date').value,
      end_date: document.getElementById('end_date').value,
      premium_amount: document.getElementById('premium_amount').value,
      status: document.getElementById('status').value
    };

    fetch(`/policys/${policyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedPolicy)
    })
    .then(response => {
      if (response.ok) {
        const row = currentEditingRow;
        row.cells[0].textContent = policyId;
        row.cells[1].textContent = updatedPolicy.policy_number;
        row.cells[2].textContent = updatedPolicy.insured_party;
        row.cells[3].textContent = updatedPolicy.coverage_type;
        row.cells[4].textContent = formatDateForTable(updatedPolicy.start_date);
        row.cells[5].textContent = formatDateForTable(updatedPolicy.end_date);
        row.cells[6].textContent = updatedPolicy.premium_amount;
        row.cells[7].textContent = updatedPolicy.status;
        
        editPolicyForm.style.display = 'none';
        mainContainer.classList.remove('blur');
      } else {
        return response.json().then(data => {
          throw new Error(data.message);
        });
      }
    })
    .catch(err => console.error(`Error updating policy: ${err.message}`));
  });

  addPolicyButton.addEventListener('click', () => {
      document.getElementById('addPolicy_number').value = '';
      document.getElementById('addInsured_party').value = '';
      document.getElementById('addCoverage_type').value = '';
      document.getElementById('addStart_date').value = '';
      document.getElementById('addEnd_date').value = '';
      document.getElementById('addPremium_amount').value = '';
      document.getElementById('addStatus').value = '';
      addPolicyForm.style.display = 'block';
      mainContainer.classList.add('blur');
  });

  deleteSaveButton.addEventListener('click', handleDelete);

  document.getElementById('addSaveButton').addEventListener('click', (event) => {
    event.preventDefault();
    const newPolicy = {
      policy_number: document.getElementById('addPolicy_number').value,
      insured_party: document.getElementById('addInsured_party').value,
      coverage_type: document.getElementById('addCoverage_type').value,
      start_date: document.getElementById('addStart_date').value,
      end_date: document.getElementById('addEnd_date').value,
      premium_amount: document.getElementById('addPremium_amount').value,
      status: document.getElementById('addStatus').value
    };
  
    fetch('/policys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newPolicy)
    })
    .then(response => response.json())
    .then(policy => {
      if (policy && policy.policy) {
        const row = document.createElement('tr');
        row.dataset.id = policy.policy.id;
        row.innerHTML = `
          <td>${policy.policy.id}</td>
          <td>${policy.policy.policy_number || 'N/A'}</td>
          <td>${policy.policy.insured_party || 'N/A'}</td>
          <td>${policy.policy.coverage_type || 'N/A'}</td>
          <td>${formatDateForTable(policy.policy.start_date) || 'N/A'}</td>
          <td>${formatDateForTable(policy.policy.end_date) || 'N/A'}</td>
          <td>${policy.policy.premium_amount || 'N/A'}</td>
          <td>${policy.policy.status || 'N/A'}</td>
          <td>
          <div class="actionButtonsDiv">
            <button class="editButton" data-id="${policy.policy.id}"><img src="./images/edit.svg">Edit</button>
            <button class="deleteButton" data-id="${policy.policy.id}"><img src="./images/delete.svg">Delete</button>
          </div>
          </td>
        `;
        tableBody.appendChild(row);

  
        row.querySelector('.editButton').addEventListener('click', handleEdit);
        row.querySelector('.deleteButton').addEventListener('click', (event) => {
          policyIdToDelete = event.target.dataset.id;
          deletePolicyForm.style.display = 'block';
          mainContainer.classList.add('blur');
        });
  
        addPolicyForm.style.display = 'none';
        mainContainer.classList.remove('blur');
        document.getElementById('addPolicy_number').value = '';
        document.getElementById('addInsured_party').value = '';
        document.getElementById('addCoverage_type').value = '';
        document.getElementById('addStart_date').value = '';
        document.getElementById('addEnd_date').value = '';
        document.getElementById('addPremium_amount').value = '';
        document.getElementById('addStatus').value = '';
      } else {
        console.error('Unexpected response format:', policy);
      }
    })
    .catch(err => console.error(`Error adding policy: ${err.message}`));
  });
  
  document.getElementById('editCloseButton').addEventListener('click', () => {
    editPolicyForm.style.display = 'none';
    mainContainer.classList.remove('blur');
  });

  document.getElementById('deleteCloseButton').addEventListener('click', () => {
    deletePolicyForm.style.display = 'none';
    mainContainer.classList.remove('blur');
  });

  document.getElementById('addCloseButton').addEventListener('click', () => {
    addPolicyForm.style.display = 'none';
    mainContainer.classList.remove('blur');
  });



  document.getElementById('logoutButton').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '../index.html';
  });

  function formatDateForTable(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  }

  function formatDateForInput(dateString) {
    return new Date(dateString).toISOString().split('T')[0];
  }
});
