import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Register from './components/register';
import Login from './components/login';

const App = () => {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [token, setToken] = useState('');
  const [editTaskId, setEditTaskId] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [notice, setNotice] = useState('');

  // Check if a token is stored in local storage on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // Fetch tasks from the server when the token changes
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_HOST}/tasks`, {
          headers: { Authorization: token },
        });
        setTasks(response.data.tasks);
      } catch (error) {
        console.error(error);
      }
    };

    if (token) {
      fetchTasks();
    }
  }, [token]);

  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setNotice('Successfully logged out.')
  };

  // Function to create a new task
  const handleCreateTask = async () => {
    if(!title) {
      setNotice('Task cannot be empty');
      return
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_HOST}/tasks`,
        { title },
        { headers: { Authorization: token } }
      );
      setTasks([...tasks, response.data.task]);
      setTitle('');
      setNotice('')
    } catch (error) {
      console.error(error);
    }
  };

  // Function to update a task
  const handleUpdateTask = async (taskId, newTitle, completed) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_HOST}/tasks/${taskId}`,
        { title: newTitle, completed: completed || false },
        { headers: { Authorization: token } }
      );
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, title: newTitle, completed: completed || false } : task
        )
      );
    } catch (error) {
      console.error(error);
    }
  };
  const handleStartEditing = (taskId, taskTitle) => {
    setEditTaskId(taskId);
    setEditedTitle(taskTitle);
  };

  const handleCancelEditing = () => {
    setEditTaskId(null);
    setEditedTitle('');
  };

  const handleConfirmEditing = (taskId) => {
    if (editedTitle.trim() !== '') {
      handleUpdateTask(taskId, editedTitle, tasks.find((task) => task.id === taskId).completed);
    }
    handleCancelEditing();
  };

  // Function to delete a task
  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_HOST}/tasks/${taskId}`, {
        headers: { Authorization: token },
      });
      setTasks(tasks.filter((task) => task.id !== taskId));
    } catch (error) {
      console.error(error);
    }
  };

  // Function to toggle task completion status
  const handleToggleTaskCompletion = async (taskId, completed, title) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_HOST}/tasks/${taskId}`,
        { completed: !completed, title },
        { headers: { Authorization: token } }
      );
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, completed: !completed } : task
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  // Store the token in local storage when it changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  // Render the application
  return (
    <div className='app-main'>
      {notice && (
        <p className={`notice notice-${notice.includes('Successfully') ? 'success' : 'error'}`}>{notice}</p>
      )}
      <h1>To-Do App</h1>
      {token ? (
        // If a token is present, render the tasks section
        <div className='app-tasks'>
          <div className='new-task'>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button onClick={handleCreateTask}>Create Task</button>
          </div>
          <ul className='current-tasks'>
            {tasks.map((task) => (
              <li
                key={task.id}
                className='task-item'
              >
                {editTaskId === task.id ? (
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleConfirmEditing(task.id);
                      } else if (e.key === 'Escape') {
                        handleCancelEditing();
                      }
                    }}
                    onBlur={() => handleConfirmEditing(task.id)}
                    autoFocus
                  />
                ) : (
                  <div
                    className='task-text'
                    onClick={() => handleStartEditing(task.id, task.title)}
                    style={{
                      textDecoration: task.completed ? 'line-through' : 'none',
                    }}
                  >
                    {task.title}
                  </div>
                )}
                <div className='task-buttons'>
                  <button onClick={() => handleToggleTaskCompletion(task.id, task.completed, task.title)} className='button-complete'>
                    {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                  </button>
                  <button onClick={() => handleDeleteTask(task.id)} className='button-delete'>Delete</button>
                </div>
              </li>
            ))}
          </ul>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        // If no token is present, render the authentication section
        <div className='app-auth'>
          <Login setToken={setToken} setNotice={setNotice} />
          <div className='auth-divider'>
            <hr />
            <span>or</span>
            <hr />
          </div>
          <Register setToken={setToken} setNotice={setNotice} />
        </div>
      )}
    </div>
  );  
};

export default App;
