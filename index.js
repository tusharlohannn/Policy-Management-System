const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const port = 3000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: 'Tusharlohan222@',
  database: 'policys2'
});

const jwtSecret = 'yourSecretKey';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

app.post('/login', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Please provide username, password, and role.' });
  }

  try {
    let query;
    let values;
    
    if (role === 'user') {
      query = 'SELECT * FROM users WHERE username = ? AND password = ?';
      values = [username, password];
    } else if (role === 'admin') {
      query = 'SELECT * FROM admin WHERE username = ? AND password = ?';
      values = [username, password];
    } else {
      return res.status(400).json({ error: 'Invalid role provided.' });
    }

    const [rows] = await pool.query(query, values);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const userId = rows[0].id;
    const token = jwt.sign({ userId, username, role }, jwtSecret, { expiresIn: '1h' });



    res.json({userId, token, role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/inventory', authenticateToken, async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM inventory WHERE status = "Active"');
    res.json(results);
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

app.get('/inventory/count', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.query('SELECT COUNT(*) AS count FROM inventory');
    res.json(result[0]);
  } catch (err) {
    console.error('Error fetching total number of policies:', err);
    res.status(500).json({ error: 'Failed to fetch total number of policies' });
  }
});

app.get('/policys', authenticateToken, async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM policys');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve policies' });
  }
});

app.get('/policys/:id', authenticateToken, async (req, res) => {
  const policyId = req.params.id;
  try {
    const [result] = await pool.query('SELECT * FROM policys WHERE id = ?', [policyId]);
    if (result.length === 0) return res.status(404).json({ message: 'Policy not found' });
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve policy' });
  }
});


app.post('/policys', authenticateToken, async (req, res) => {
  const { policy_number, insured_party, coverage_type, start_date, end_date, premium_amount, status } = req.body;
  const policy = { policy_number, insured_party, coverage_type, start_date, end_date, premium_amount, status };
  try {
    const [result] = await pool.query('INSERT INTO policys SET ?', policy);
    res.status(201).json({ message: 'Policy added successfully', policy: { id: result.insertId, ...policy } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add policy' });
  }
});

app.put('/policys/:id', authenticateToken, async (req, res) => {
  const policyId = req.params.id;
  const { policy_number, insured_party, coverage_type, start_date, end_date, premium_amount, status } = req.body;
  const updatedPolicy = { policy_number, insured_party, coverage_type, start_date, end_date, premium_amount, status };
  try {
    const [result] = await pool.query('UPDATE policys SET ? WHERE id = ?', [updatedPolicy, policyId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Policy not found' });
    res.json({ message: 'Policy updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update policy' });
  }
});

app.delete('/policys/:id', authenticateToken, async (req, res) => {
  const policyId = req.params.id;
  try {
    const [result] = await pool.query('DELETE FROM policys WHERE id = ?', [policyId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Policy not found' });
    res.json({ message: 'Policy deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete policy' });
  }
});

app.get('/usersList', authenticateToken, async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM usersList');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

app.get('/usersList/:id', authenticateToken, async (req, res) => {
  const userId = req.params.id;
  try {
    const [result] = await pool.query('SELECT * FROM usersList WHERE id = ?', [userId]);
    if (result.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
});

app.post('/usersList', authenticateToken, async (req, res) => {
  const { username, password } = req.body;
  try {
    const [result] = await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
    res.status(201).json({message: 'User added successfully', username, password });
  } catch (err) {
    console.error('Error adding user:', err);
    res.status(500).json({ error: 'Failed to add user' });
  }
});

app.put('/usersList/:id', authenticateToken, async (req, res) => {
  const userId = req.params.id;
  const { userName, password } = req.body;
  try {
    const [result] = await pool.query('UPDATE users SET username = ?, password = ? WHERE id = ?', [userName, password, userId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/usersList/:id', authenticateToken, async (req, res) => {
  const userId = req.params.id;
  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.get('/policyRequests', authenticateToken, async (req, res) => {
  try {
    const [requests] = await pool.query(`
      SELECT r.id, p.policy_number, u.username as requested_by 
      FROM policy_requests r 
      JOIN policys p ON r.policy_id = p.id 
      JOIN users u ON r.user_id = u.id 
      WHERE r.status = 'Pending'
    `);
    res.json(requests);
  } catch (err) {
    console.error('Error fetching requests:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

app.get('/policyRequests/count', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.query('SELECT COUNT(*) AS count FROM policy_requests WHERE status = "Pending"');
    res.json(result[0]);
  } catch (err) {
    console.error('Error fetching total number of pending requests:', err);
    res.status(500).json({ error: 'Failed to fetch total number of pending requests' });
  }
});

app.post('/policyRequests/:id', authenticateToken, async (req, res) => {
  const policyId = req.params.id;
  const userId = req.user.userId;

  try {
    const [existingPolicy] = await pool.query(
      'SELECT * FROM policy_requests WHERE user_id = ? AND policy_id = ?',
      [userId, policyId]
    );

    if (existingPolicy.length > 0) {
      return res.status(400).json({ message: 'You have already requested this policy.' });
    }

    await pool.query(
      'INSERT INTO policy_requests (user_id, policy_id, status) VALUES ( ?, ?, "Pending")',
      [userId, policyId]
    );

    res.status(201).json({ message: 'Policy request sent successfully' });
  } catch (err) {
    console.error('Error creating policy request:', err);
    res.status(500).json({ error: 'Failed to create policy request', details: err.message });
  }
});


app.post('/policyRequests/:id/accept', authenticateToken, async (req, res) => {
  const requestId = req.params.id;

  try {
    const [request] = await pool.query('SELECT user_id, policy_id FROM policy_requests WHERE id = ?', [requestId]);

    if (request.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const { user_id, policy_id } = request[0];

    const [existingPolicy] = await pool.query(
      'SELECT * FROM policy_requests WHERE user_id = ? AND policy_id = ?',
      [user_id, policy_id]
    );

    if (existingPolicy.length > 0) {
      await pool.query('UPDATE policy_requests SET status = "Rejected" WHERE id = ?', [requestId]);
      return res.json({message: 'Accepted!'});
    }

    await pool.query('INSERT INTO user_policies (user_id, policy_id) VALUES (?, ?)', [user_id, policy_id]);

    await pool.query('UPDATE policy_requests SET status = "Accepted" WHERE id = ?', [requestId]);

    res.json({ message: 'Request accepted and policy added successfully' });
  } catch (err) {
    console.error('Error accepting request:', err);
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

app.post('/policyRequests/:id/reject', authenticateToken, async (req, res) => {
  const requestId = req.params.id;

  try {
    await pool.query('UPDATE policy_requests SET status = "Rejected" WHERE id = ?', [requestId]);

    res.json({ message: 'Request rejected successfully' });
  } catch (err) {
    console.error('Error rejecting request:', err);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});





app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
