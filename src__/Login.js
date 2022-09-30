import React, { Component, useState, useEffect }  from 'react';
import rubii from './img/rubii.png';
import userAvatar from './img/avatar.png';
import rubiibubble from './img/rubii-bubble.png';
import refresh from './img/rubii-refresh.png';
import play from './img/play.png';
import pause from './img/pause.png';
import smallpause from './img/small-pause.png';
import axios from 'axios';
// Import electron
const electron = window.require('electron');
const remote = electron.remote;
const shell = electron.shell;
const ipcRenderer = electron.ipcRenderer;
const globalShortcut = electron.globalShortcut
const getCurrentWindow = electron.getCurrentWindow;

function Login() {

    const [choosenAccountId, setChoosenAccountId] = useState('');
    const [nbrAccounts, setNbrAccounts] = useState(0);
    const [multipleAccounts, setMultipleAccounts] = useState([]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [clients, setClients] = useState([]);
    const [activeClient, setActiveClient] = useState([]);
    const [activeClientTimer, setActiveClientTimer] = useState([]);
    const [activeTasks, setActiveTasks] = useState([]);
    const [activeTask, setActiveTask] = useState([]);
    const [activeTaskTimer, setActiveTaskTimer] = useState([]);
    const [loader, setLoader] = useState(false);
    const [loaderAddTask, setLoaderAddTask] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [timeFormat, setTimeFormat] = useState('00:00:00');
    const [timer, setTimer] = useState(false);
    const [searchValueClient, setSearchValueClient] = useState("");
    const [searchValueTask, setSearchValueTask] = useState("");
    const [addToDoTask, setAddToDoTask] = useState("");
    const [completedTasks, setCompletedTasks] = useState(false); 
    const [userData, setUserData] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [mainLoader, setMainLoader] = useState(false);
    const [IsFirstTimeLanding, setIsFirstTimeLanding] = useState(false);
    const [FromLoggingForm, setFromLoggingForm] = useState(false);
    const [refreshProgress, setRefreshProgress] = useState(false);
    // Dropdown
    const [isOpen, setOpen] = useState(false);
    const toggleDropdown = () => setOpen(!isOpen);

    // Logout
    const handleLogout = () => {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('timer');
      setUserData([]);
      setIsLoggedIn(false);
      setLoader(false);
      setIsFirstTimeLanding(false);
      setFromLoggingForm(false);
      setSeconds(0);
      setTimer(false);
      setActiveTaskTimer([]);
      setActiveClientTimer([]);
      setClients([]);
      clearInterval(timer);   // <-- Change here
      setTimer(false);
      setOpen(false);
      setMultipleAccounts([]);
      setNbrAccounts(0);
      setChoosenAccountId('');
    };

    // Refresh

    const handleRefresh = () => {

      setLoader(true);
      setMainLoader(true);

      // We need to stop the timer if it's already running
      setActiveTaskTimer([]);
      setActiveClientTimer([]);
      clearInterval(timer);   // <-- Change here
      setTimer(false);
      const timerDataSession = {
        timer: 0,
        timer_id: '',
        company_id: ''
      };
      sessionStorage.setItem('timer', JSON.stringify(timerDataSession));
      setClients([]);

    };

    const chooseClient = (client) => {
      setActiveClient(client);
      setActiveTasks(client.tasks);
      if(!timer) {
        setSeconds(client.seconds_tracked); // OK?
      }
      setActiveTask([]); // Reset
    };

    const chooseTask = (task) => {
      setActiveTask(task);
    };

    const chooseAccount = (value) => {
      setChoosenAccountId(value);
    };

    const addTask = () => {

      if(addToDoTask != '') {

        setLoaderAddTask(true);

        axios({
          method: "POST",
          url: process.env.REACT_APP_API_URL + '/desktop/add_task',
          headers: { 'Content-Type': 'application/json;charset=UTF-8', "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Origin": "*", "Accept": "application/json" },
          data: {
            task: addToDoTask,
            company: activeClient,
            user: userData
          }
        }).then(result => {

          if(result.data.json.error == false) {
            activeClient.tasks.push(result.data.json.task);
            //activeTasks.push(result.data.json.task);
          }
          
          setAddToDoTask('');
          setLoaderAddTask(false);
 
        })
        .catch(error => {
          setErrorMessage('Unexpected error');
        })

      }

    };

    const handleLogin = (event) => {

      //Prevent page reload
      event.preventDefault();

      axios({
        method: "POST",
        url: process.env.REACT_APP_API_URL + '/desktop/login',
        headers: { 'Content-Type': 'application/json;charset=UTF-8', "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Origin": "*", "Accept": "application/json" },
        data: {
          email: email,
          password: password,
          choosenAccountId: choosenAccountId
        }
      })
      .then(result => {
          if(result.data.json.error == false) {
            // Ok the user was able to logged in with no issue
            var userLogin = result.data.json.userLogin;
            setUserData(userLogin);
            setErrorMessage('');
            setIsLoggedIn(true);
            setLoader(true);
            setFromLoggingForm(true);
            sessionStorage.setItem('user', JSON.stringify(userLogin));

            // Handle the data we need to check if timer is on 
            const timerDataSession = {
              timer: 0,
              timer_id: '',
              company_id: ''
            };
            sessionStorage.setItem('timer', JSON.stringify(timerDataSession));

          } else {
            // Credentials are wrong
            setErrorMessage(result.data.json.message);
            // If multiple accounts
            if(result.data.json.nbr_accounts > 1) {
              setNbrAccounts(result.data.json.nbr_accounts); // Nbrs
              setMultipleAccounts(result.data.json.users); // List of all users
            } else {
              setMultipleAccounts([]);
              setNbrAccounts(0);
              setChoosenAccountId('');
            }
          }
      })
      .catch(error => {
        setErrorMessage('Unexpected error');
      })

    };
   
    useEffect(() => {

      // First time only when the open the software
      //if(userData != null && !FromLoggingForm) {
      //  setLoader(true);
      //  setIsLoggedIn(true);
      //}

      var sessionUser = sessionStorage.getItem("user");
      var sessionUser = JSON.parse(sessionUser);

      if(sessionUser && !isLoggedIn) {
        setUserData(sessionUser);
        setIsLoggedIn(true);
        setLoader(true);
        setMainLoader(true);
      }

      if(isLoggedIn && loader && clients.length === 0) {

        axios({
            method: "POST",
            url: process.env.REACT_APP_API_URL + '/desktop/get',
            headers: { 'Content-Type': 'application/json;charset=UTF-8', "Access-Control-Allow-Origin": "*", "Accept": "application/json" },
            data: {
              user_id: userData.id
            }
          }).then(result => {
            setClients(result.data.json.clients);
            setActiveClient(result.data.json.client);
            setActiveTasks(result.data.json.client.tasks);
            setSeconds(result.data.json.client.seconds_tracked);
            setLoader(false);
            setMainLoader(false);
            if(!FromLoggingForm) {
              setFromLoggingForm(true);
            }
          });

      }
          
    }, [clients, isLoggedIn, loader, userData])

    useEffect(() => {
      if (seconds > 0 && timer) {
        axios({
          method: "POST",
          url: process.env.REACT_APP_API_URL + '/desktop/track',
          headers: { 'Content-Type': 'application/json;charset=UTF-8', "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Origin": "*", "Accept": "application/json" },
          data: {
            activeTask: activeTaskTimer,
            activeClient: activeClientTimer,
            user: userData,
            seconds: seconds
          }
        })
        .then(result => {
          if(result.data.json.error == false) {
            activeClientTimer.seconds_tracked = result.data.json.seconds_tracked; // seconds
            var sessionTimer = sessionStorage.getItem("timer");
            var sessionTimer = JSON.parse(sessionTimer);
            if(sessionTimer.timer == 0 || sessionTimer.company_id == null || sessionTimer.company_id == '') {
              const timerDataSession = {
                timer: 1,
                timer_id: result.data.json.timer_id,
                company_id: result.data.json.company_id
              };
              sessionStorage.setItem('timer', JSON.stringify(timerDataSession));
            }
          } else {
            setActiveTaskTimer([]);
            setActiveClientTimer([]);
            clearInterval(timer);   // <-- Change here
            setTimer(false);
            const timerDataSession = {
              timer: 0,
              timer_id: '',
              company_id: ''
            };
            sessionStorage.setItem('timer', JSON.stringify(timerDataSession));
            alert(result.data.json.message);
          }
        })
        .catch(error => {
          console.log(error);
        })
      }
    }, [seconds, userData]);

    const handleStartToggle = (seconds) => {
      // Start new timer only if it's not run yet
      if(!timer && activeTask.id) {

        setActiveTaskTimer(activeTask);
        setActiveClientTimer(activeClient);

        setTimer(setInterval(() => {
          setSeconds((current) => current + 1);
          const newObjActiveTask = activeTask;
          newObjActiveTask.seconds_tracked = newObjActiveTask.seconds_tracked + 1;
          setActiveTask(newObjActiveTask);
        }, 1000));
        
      // Else, it's already running, we stop it and reset
      } else {
        setActiveTaskTimer([]);
        setActiveClientTimer([]);
        clearInterval(timer);   // <-- Change here
        setTimer(false);
        const timerDataSession = {
          timer: 0,
          timer_id: '',
          company_id: ''
        };
        sessionStorage.setItem('timer', JSON.stringify(timerDataSession));
      }
    }

    const toHHMMSS = (seconds) => {

      var sec_num = parseInt(seconds, 10)
      var hours   = Math.floor(sec_num / 3600)
      var minutes = Math.floor(sec_num / 60) % 60
      var seconds = sec_num % 60;

      var value = [hours,minutes,seconds]
      .map(v => v < 10 ? "0" + v : v)
      .filter((v,i) => v !== "00" || i > 0)
      .join(":");

      if(hours == 0) {
        value = '00:' + value;
      }

      return value;

    }

    const renderForm = (
      <div>

        <div className="login">
          <div className="login-form">
            <img src={rubii} className="logo" />
            <div className="form">
              <form onSubmit={handleLogin}>
                  <div className="input-container">
                      <input type="text"  value={email || ""} required placeholder="Email" onChange={e => setEmail(e.target.value)}/>
                  </div>
                  <div className="input-container mt-20">
                    <input type="password" value={password || ""} required placeholder="Password" onChange={e => setPassword(e.target.value)}/>
                  </div>
                  <div className="extra-buttons">
                      <div className="remember-me checkbox text-left">
                          <input type="checkbox" value="lsRememberMe" id="rememberMe" /> <label htmlFor="rememberMe" className="checkbox">Remember me</label>
                      </div>
                      <div className="forgot-password text-right">
                          <div className="cursor-pointer" onClick={() => { shell.openExternal("https://rubii.com/app/forgot_password"); }}>Forgot Password?</div>
                      </div>
                  </div>
                  <div className="error-container">
                    <div className="error">{errorMessage}</div>

                    {(nbrAccounts > 1 ) && <div>
                    <div className="error">You have multiple account under this email address. <br />Please choose the correct account below.</div>
                    <br />
                    <select
                      value={choosenAccountId}
                      onChange={e => chooseAccount(e.target.value)}
                      className="selectAccount"
                    >
                      <option value="">Please choose</option>
                      {multipleAccounts.map(({ id, username_login }, index) => <option value={id} >{username_login}</option>)}
                    </select>

                    </div>}

                  </div>
                  <div className="button-container">
                      <button className="loginBtn" type="submit" disabled={loader}>
                      {loader ?
                        'Login...'
                        : 'Login'
                      }
                      </button>
                  </div>
                </form>
            </div>
          </div>
        </div>
      </div>
    );
    
    // List of clients

    const filterNamesClient = ({ name }) => {
      return name.toLowerCase().indexOf(searchValueClient.toLowerCase()) !== -1;
    };

    const listClients = clients.filter(filterNamesClient).map(function(client, index) {
      return (
        <li key={index} onClick={() => chooseClient(client)} className={activeClientTimer.id === client.id ? "active" : (activeClient.id === client.id ? "activeClick" : "")}>
          {activeClientTimer.id === client.id &&<span className="smallbtnblockClient"> <img src={smallpause} className="play-sm-client" onClick={handleStartToggle} /> </span>}<span className="clientNameTrigger">{client.name}</span>
        </li>
      ); 
    }); 

    const filterTask = ({ name, dueComplete }) => {
      if(completedTasks) {
        if(completedTasks == dueComplete) {
          return name.toLowerCase().indexOf(searchValueTask.toLowerCase()) !== -1;
        }
      } else {
        return name.toLowerCase().indexOf(searchValueTask.toLowerCase()) !== -1;
      }
    };

    // List of tasks based on active client
    const listTasks = activeTasks.filter(filterTask).map(function(task, index) {
      return (
        <li key={index} onClick={() => chooseTask(task)} className={activeTaskTimer.id === task.id ? "taskTableDetails active" : (activeTask.id === task.id ? "taskTableDetails activeClick" : "taskTableDetails")}> 
          {activeTaskTimer.id === task.id &&<span className="smallbtnblock"> <img src={smallpause} className="play-sm" onClick={handleStartToggle} /> </span>}<span className="left-task">{task.name}<br /> {toHHMMSS(task.seconds_tracked)}</span> <span className="right-task">{task.due_formated_desktop}</span>
        </li>
      ); 
    }); 

    const handleShowCompleted = () => { 
      setCompletedTasks(!completedTasks);
    };

    const showTasksClient = (
      <div>
        {listTasks.length > 0 ?
        <div>
          <div className="row tasks-lister">
            <div className="left">
              <span>Tasks</span>
            </div>
            <div className="right">
              <span>Due</span>
            </div>
          </div>
          <div className="flexcroll flexcroll-mini2">
            <div className="row">
                <ul className="list">
                  {listTasks}
                </ul>
            </div>
          </div>
        </div>
        : <div className="mt-2">No tasks have been found.</div>
      }
      </div>
    );

    const Dropdown = (
      <div>
         <div className="row text-right">
          <div className='dropdown'>
            <div className='dropdown-header' onClick={toggleDropdown}>
              <img src={userData.avatar} className="user-avatar" />
              <span className="dots">...</span>
            </div>
            <div className={`dropdown-body ${isOpen && 'open'}`}>
              <div className="dropdown-item" onClick={handleLogout}>Sign Out</div>
              <div className="dropdown-item" onClick={() => { shell.openExternal("https://rubii.com/app"); }}>Open Dashboard</div>
              <div className="dropdown-item" onClick={() => { shell.openExternal("https://rubii.com"); }}>Help Center</div>
              <div className="dropdown-item" onClick={() => { shell.openExternal("https://rubii.com"); }}>About Rubii</div>
              <div className="dropdown-item" onClick={() => {  ipcRenderer.send('close-me'); }}>Quit Rubii</div>
            </div>
          </div>
        </div>
      </div>
    );

    const deskTopApp = (
    <div>
      {!loader ?
      <div className="desktop-container">

        <div className="desktop-left">

          <div className="row">
            <img src={rubiibubble} className="logo" />
          </div>

          <div className="row">
            <div className="timer-clock">
            <div>{toHHMMSS(seconds)}</div> <span className="icon"></span><br /> {seconds}
            </div>
          </div>

          <div className="row project-task-showcase">

            {timer && <div><h2 className="client-name"> {activeClientTimer.name}</h2><p className="task-name">{activeTaskTimer.name}</p></div>}
            {!timer && <div><h2 className="client-name"> {activeClient.name}</h2><p className="task-name">{activeTask.name}</p></div>}

            {timer && <img src={pause} className="play" onClick={handleStartToggle} />}
            {!timer && <img src={play} className="play" onClick={handleStartToggle} />} test if cache....
          </div>

          <div className="row project-task-showcase-search">
            <input type="text" value={searchValueClient} onChange={e => setSearchValueClient(e.target.value)} className="search-bar" placeholder="Search Clients"/>
          </div>

          <div className="row list-clients">
              <span className="clientsName">Clients</span>
          </div>

          <div className="flexcroll flexcroll-mini">
            <div className="row">
                <ul className="list">
                  {listClients}
                </ul>
            </div>
          </div>

          <div onClick={handleRefresh} className="refreshIcon">
            <img src={refresh} className="refresh" /> <span className="text">Refresh</span>
          </div>

        </div>

        <div className="desktop-right">

          <div className="wrapper-right">

            {userData ?
             <div>{Dropdown}</div>
              : ''
            }

            <div className="row right-task-intro">
              <h2 className="client-name">Tasks</h2>
              <p className="task-name">{activeClient.name}</p>
            </div>

            <div className="row right-task-entry">
              <div className="left">
                <input type="checkbox" id="showCompleted" onChange={handleShowCompleted} />
                <label className="checkbox" htmlFor="showCompleted">Show Completed</label>
              </div>
              <div className="right text-right">
                <input type="text" value={searchValueTask} onChange={e => setSearchValueTask(e.target.value)}  className="search-bar-tasks" placeholder="Search Tasks"/>
              </div>
            </div>

            <div className="row addTask-row">
              <div className="left">
                <input type="text" className="bar" value={addToDoTask || ""} required placeholder="Add Task" onChange={e => setAddToDoTask(e.target.value)}/>
                <div className="addTaskBtn" onClick={addTask} disabled={loaderAddTask}>
                  +
                </div>
              </div>
            </div>

              {showTasksClient}

              {activeTask.id ?
                <div className="flexcroll chart-container">
                    <div className="fixed-bottom-task">
                      <div className="flex-display">
                        <div className="leftBottomDisplay">
                          <p><strong>{activeTask.name}</strong></p>
                          <p>({activeTask.identificator})</p>
                          <span className="lastActivity">{activeTask.dateLastActivityFormat}</span><br /><br />
                        </div>
                        <div className="rightBottomDisplay">
                          <p><strong>{activeTask.status_txt}</strong></p>
                        </div>
                        {activeTask.url ? 
                        <div className="rightBottomDisplayo">
                          <p className="cursor-pointer" onClick={() => { shell.openExternal(activeTask.url); }}><strong>Open Task</strong></p>
                        </div>
                        : ''}
                      </div>
                    {activeTask.desc ? <div dangerouslySetInnerHTML={{__html: activeTask.desc_for_html}}/>: 'No description'}</div>
                </div>
                : ''
              }
            
          </div>

        </div>

      </div>
      : 'Loading...'
    }
    </div>
    );

    return (
      <div>
        {isLoggedIn && !loader ? deskTopApp
        : isLoggedIn && mainLoader ? 'Please wait...'
        : renderForm}
      </div>
    )
}

export default Login;