import React, { Component, useState, useEffect }  from 'react';
import rubii from './img/rubii.png';
import userAvatar from './img/avatar.png';
import rubiibubble from './img/rubii-bubble.png';
import Spinner from './Spinner.js';
import refresh from './img/rubii-refresh.png';
import play from './img/play.png';
import pause from './img/pause.png';
import smallpause from './img/small-pause.png';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import audio from './woosh.mp3';
import { useSpeechSynthesis } from "react-speech-kit";
// Import electron
const electron = window.require('electron');
const remote = electron.remote;
const shell = electron.shell;
const ipcRenderer = electron.ipcRenderer;
const globalShortcut = electron.globalShortcut
const getCurrentWindow = electron.getCurrentWindow;
const log = window.require('electron-log');
const pj = require('../package.json');

function Login() {

    const { speak, voices } = useSpeechSynthesis();

    const [choosenAccountId, setChoosenAccountId] = useState('');
    const [choosenFilterTask, setChoosenFilterTask] = useState('nameaz');
    const [choosenStatusTask, setChoosenStatusTask] = useState('all');
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
    const [activity, setActivity] = useState([]);
    const [loader, setLoader] = useState(false);
    const [loaderAddTask, setLoaderAddTask] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [secondsDisplay, setSecondsDisplay] = useState(0);
    const [timeFormat, setTimeFormat] = useState('00:00:00');
    const [timer, setTimer] = useState(false);
    const [timerChild, setTimerChild] = useState(false);
    const [searchValueClient, setSearchValueClient] = useState("");
    const [searchValueTask, setSearchValueTask] = useState("");
    const [addToDoTask, setAddToDoTask] = useState("");
    const [completedTasks, setCompletedTasks] = useState(false); 
    const [hiddenTasks, setHiddenTasks] = useState(false); 
    const [ongoingTasks, setOngoingTasks] = useState(false); 
    const [userData, setUserData] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [mainLoader, setMainLoader] = useState(false);
    const [IsFirstTimeLanding, setIsFirstTimeLanding] = useState(false);
    const [FromLoggingForm, setFromLoggingForm] = useState(false);
    const [isDisconnected, setIsDisconnected] = useState(false);
    const [refreshProgress, setRefreshProgress] = useState(false);
    // Dropdown
    const [isOpen, setOpen] = useState(false);
    const toggleDropdown = () => setOpen(!isOpen);
    // Dropdown Info
    const [isOpenInfo, setOpenInfo] = useState(false);
    const toggleDropdownInfo = () => setOpenInfo(!isOpenInfo);
    // Dropdown Task
    const [isOpenTask, setOpenTask] = useState(false);
    const toggleDropdownTask = () => setOpenTask(!isOpenTask);

    const toggleDropdownTaskChecker = (task) => {
      const updatedTasks = activeTasks.map((t) => {
        if (t.id !== task.id) {
          return { ...t, is_open_dropdown: false };
        } else {
          return { ...t, is_open_dropdown: !t.is_open_dropdown };
        }
      });
      setActiveTasks(updatedTasks);
    };

    // Retry up to 5 times with a 5 seconds delay
    //  retryCondition: axiosRetry.isRetryableError

    axiosRetry(axios, {
     retries: 5, // number of retries,
     shouldResetTimeout: true,
      retryDelay: (retryCount) => {
        return retryCount * 5000;
      },
      retryCondition: (_error) => true
    });

    // Set activity if there were any keyboard, mouse
    useEffect(()=>{
      const listener= (_, data) => {
        setActivity(data);
      };
      ipcRenderer.on('set-activity', listener);
      
      return ()=>{
        ipcRenderer.removeListener('set-activity', listener);
      }
    })

    // Logout
    const handleLogout = (voiceOn) => {

      var sessionUser = sessionStorage.getItem("user");
      var sessionUser = JSON.parse(sessionUser);

      sessionStorage.removeItem('user');
      sessionStorage.removeItem('timer');
      setUserData([]);
      setIsLoggedIn(false);
      setLoader(false);
      setIsFirstTimeLanding(false);
      setFromLoggingForm(false);
      setSeconds(0);
      setSecondsDisplay(0);
      setTimer(false);
      setTimerChild(false);
      setActiveTask([]);
      setActiveTaskTimer([]);
      setActiveClientTimer([]);
      setActiveClient([]);
      setClients([]);
      clearInterval(timer);   // <-- Change here
      clearInterval(timerChild); 
      setTimer(false);
      setTimerChild(false);
      setOpen(false);
      setMultipleAccounts([]);
      setNbrAccounts(0);
      setChoosenAccountId('');
      setIsDisconnected(true);
    };

    // Refresh

    const handleRefresh = () => {

      setLoader(true);
      setMainLoader(true);

      // We need to stop the timer if it's already running
      setActiveTaskTimer([]);
      setActiveClientTimer([]);
      clearInterval(timer);   // <-- Change here
      clearInterval(timerChild);
      setTimer(false);
      setTimerChild(false);
      const timerDataSession = {
        timer: 0,
        timer_id: '',
        company_id: ''
      };
      sessionStorage.setItem('timer', JSON.stringify(timerDataSession));
      setClients([]);
    };

    const chooseClient = (client) => {
      client.tasks = generateObjTaskFilter(client.tasks, choosenFilterTask);
      setActiveClient(client);
      setActiveTasks(client.tasks);
      if(!timer) {
        setSeconds(client.seconds_tracked); // OK?
        setSecondsDisplay(client.seconds_tracked);
      }
      setActiveTask([]); // Reset
    };

    const chooseTask = (task) => {
      setActiveTask(task);
    };

    const chooseAccount = (value) => {
      setChoosenAccountId(value);
    };

    const chooseTaskFilter = (value) => {
      new Audio(audio).play();
      setChoosenFilterTask(value);
      var sortedTasks = generateObjTaskFilter(activeTasks, value);
      setActiveTasks(sortedTasks);
    };

    const chooseStatusFilter = (value) => {
      new Audio(audio).play();
      setChoosenStatusTask(value);

      // Reset
      setCompletedTasks(false);
      setHiddenTasks(false);
      setOngoingTasks(false);

      if(value === 'completed') {
        setCompletedTasks(!completedTasks);
      } else if(value === 'hidden') {
        setHiddenTasks(!hiddenTasks);
      } else if(value === 'ongoing') {
        setOngoingTasks(!ongoingTasks);
      }

    };

    const generateObjTaskFilter = (newObject, value) => {
      if(value == 'nameza') {
        newObject.sort((a, b) => (a.strtolower_name < b.strtolower_name) ? 1 : -1);
      } else if(value == 'nameaz') {
        newObject.sort((a, b) => (a.strtolower_name > b.strtolower_name) ? 1 : -1);
      } else if(value == 'dueasc') {
        newObject.sort((a,b) => b.strtotime_due - a.strtotime_due);
      } else if(value == 'duedesc') {
        newObject.sort((a,b) => a.strtotime_due - b.strtotime_due);
      }

      return newObject;
    };

    const deleteTask = () => {

      // Display a confirmation dialog box
      if (!window.confirm('Are you sure you want to delete this task?')) {
        return;
      }

      new Audio(audio).play();

      const newObj = { ...activeTask, is_deleted: true };
      setActiveTask(newObj);

      // Client Tasks
      activeClient.tasks.map(function(item, i){
        if(item.id == activeTask.id) {
            item.is_deleted = true;
        }
      })

      // Clients
      clients.map(function(client, i){
        clients.map(function(item, t){
          if(item.id == activeTask.id) {
            item.is_deleted = true;
          }
        })
      })
      
      axios({
        method: "POST",
        url: process.env.REACT_APP_API_URL + '/desktop/delete_task',
        headers: { 'Content-Type': 'application/json;charset=UTF-8', "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Origin": "*", "Accept": "application/json" },
        data: {
          task: activeTask,
          user: userData
        }
      }).then(result => {
        //console.log(result.data.json);
      })
      .catch(error => {
        setErrorMessage('Unexpected error');
      })

      const updatedTasks = activeTasks.map((t) => {
        if (t.id === activeTask.id) {
          return { ...t, is_open_dropdown: false, is_deleted: true };
        } else {
          return { ...t, is_open_dropdown: false };
        }
      });

      setActiveTasks(updatedTasks);
      setActiveTask([]); 

    };

    const openTrelloLink = (url) => {
      shell.openExternal(url);
      const updatedTasks = activeTasks.map((t) => {
        return { ...t, is_open_dropdown: false };
      });
      setActiveTasks(updatedTasks);;
    };

    const completedTask = () => {

      new Audio(audio).play();

      if(activeTask.is_completed == true) {
        var is_completed_d = false;
        var is_completed_d_txt = 'Ongoing';
      } else {
        var is_completed_d = true;
        var is_completed_d_txt = 'Completed';
      }

      const newObj = { ...activeTask, is_completed: is_completed_d, status_txt: is_completed_d_txt };
      setActiveTask(newObj);

      // Client Tasks
      activeClient.tasks.map(function(item, i){
        if(item.id == activeTask.id) {
            item.is_completed = is_completed_d;
            item.status_txt = is_completed_d_txt;
        }
      })

      // Clients
      clients.map(function(client, i){
        clients.map(function(item, t){
          if(item.id == activeTask.id) {
              item.is_completed = is_completed_d;
              item.status_txt = is_completed_d_txt;
          }
        })
      })
      
      axios({
        method: "POST",
        url: process.env.REACT_APP_API_URL + '/desktop/set_completed_task',
        headers: { 'Content-Type': 'application/json;charset=UTF-8', "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Origin": "*", "Accept": "application/json" },
        data: {
          task: activeTask,
          user: userData
        }
      }).then(result => {
        //console.log(result.data.json);
      })
      .catch(error => {
        setErrorMessage('Unexpected error');
      })

      const updatedTasks = activeTasks.map((t) => {
        if (t.id === activeTask.id) {
          return { ...t, is_open_dropdown: false, is_completed: is_completed_d, status_txt: is_completed_d_txt };
        } else {
          return { ...t, is_open_dropdown: false };
        }
      });
      
      setActiveTasks(updatedTasks);
      setActiveTask([]); 

    };

    const hideTask = () => {

      new Audio(audio).play();

      if(activeTask.hidden == true) {
        console.log('we unhide it')
        var is_hidden = false;
        var status_txt = 'Ongoing';
      } else {
        console.log('we hide it')
        var is_hidden = true;
        var status_txt = 'Hidden';
      }

      const newObj = { ...activeTask, hidden: is_hidden, status_txt: status_txt };
      setActiveTask(newObj);

      // Client Tasks
      activeClient.tasks.map(function(item, i){
        if(item.id == activeTask.id) {
            item.hidden = is_hidden;
            item.status_txt = status_txt;
        }
      })

      // Clients
      clients.map(function(client, i){
        clients.map(function(item, t){
          if(item.id == activeTask.id) {
              item.hidden = is_hidden;
              item.status_txt = status_txt;
          }
        })
      })
      
      axios({
        method: "POST",
        url: process.env.REACT_APP_API_URL + '/desktop/hide_task',
        headers: { 'Content-Type': 'application/json;charset=UTF-8', "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Origin": "*", "Accept": "application/json" },
        data: {
          task: activeTask,
          user: userData
        }
      }).then(result => {
        //console.log(result.data.json);
      })
      .catch(error => {
        setErrorMessage('Unexpected error');
      })

      const updatedTasks = activeTasks.map((t) => {
        if (t.id === activeTask.id) {
          return { ...t, is_open_dropdown: false, hidden: is_hidden, status_txt: status_txt };
        } else {
          return { ...t, is_open_dropdown: false };
        }
      });
      
      setActiveTasks(updatedTasks);
      // Reset
      setActiveTask([]);

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
            const newObjTasks = generateObjTaskFilter(activeClient.tasks, choosenFilterTask);
            setActiveTasks(newObjTasks);
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

      setLoader(true);
      setMainLoader(true);

      setErrorMessage('');

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
            setIsDisconnected(false);
            setUserData(userLogin);
            setErrorMessage('');
            setIsLoggedIn(true);
            setFromLoggingForm(true);
            clearInterval(timer);   // <-- Change here
            clearInterval(timerChild); 
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

            setLoader(false);
            setMainLoader(false);

          }

      })
      .catch(error => {
        setErrorMessage('Unexpected error, check your network');
        setLoader(false);
        setMainLoader(false);
      })

    };
   
    useEffect(() => {

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
            setSecondsDisplay(result.data.json.client.seconds_tracked);
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

        let source = axios.CancelToken.source();

        axios({
          method: "POST",
          url: process.env.REACT_APP_API_URL + '/desktop/track?' + new Date().getTime(),
          headers: { 'Content-Type': 'application/json;charset=UTF-8', "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Origin": "*", "Accept": "application/json" },
          data: {
            cancelToken: source.token,
            activeTask: activeTaskTimer,
            activeClient: activeClientTimer,
            user: userData,
            seconds: seconds,
            activity: activity,
            newTimeFrame: 1,
            newTimeMinFrame: 1
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
            if(activeClient.start_subscription_period) {
              activeClient.worked_seconds = activeClient.worked_seconds + 15;
              //clients.map(function(client, i){
              //  if(client.id == activeClient.id) {
              //    client.worked_seconds = client.worked_seconds + 15;
              //  }
              //})
            }
          } else {
            setActiveTaskTimer([]);
            setActiveClientTimer([]);
            clearInterval(timer);   // <-- Change here
            clearInterval(timerChild); 
            setTimer(false);
            setTimerChild(false);
            const timerDataSession = {
              timer: 0,
              timer_id: '',
              company_id: ''
            };
            sessionStorage.setItem('timer', JSON.stringify(timerDataSession));
            alert(result.data.json.message);
            speak({
              text: result.data.json.message,
              voice: voices[1],
            });
          }
        })
        .catch((error) => {

          if(isDisconnected === false) {
            handleLogout(0);
            speak({
              text: 'There is something wrong with your network! Please login again',
              voice: voices[1],
            });
            ipcRenderer.send('bad-internet');
          }

      })
     }
    }, [seconds, userData]);

    const handleStartToggle = (seconds) => {

      if(activeClient.is_locked_monthly_cap && activeClient.is_locked_monthly_cap == 1) {
        speak({
          text: activeClient.is_locked_monthly_cap_message,
          voice: voices[1],
        });
        alert(activeClient.is_locked_monthly_cap_message);
        return false;
      }

      // Start new timer only if it's not run yet
      if(!timer && activeTask.id) {

        new Audio(audio).play();

        setActiveTaskTimer(activeTask);
        setActiveClientTimer(activeClient);

        // Every 60 seconds to avoid overload
        setTimer(setInterval(() => {
          setSeconds((current) => current + 15);
        }, 15000));

        // Every seconds
        setTimerChild(setInterval(() => {
          const newObjActiveTask = activeTask;
          newObjActiveTask.seconds_tracked = newObjActiveTask.seconds_tracked + 1;
          setActiveTask(newObjActiveTask);
          setSecondsDisplay((current_display) => current_display + 1);
        }, 1000));
        
      // Else, it's already running, we stop it and reset
      } else {
        if(timer) {

          new Audio(audio).play();

          setActiveTaskTimer([]);
          setActiveClientTimer([]);
          clearInterval(timer);   // <-- Change here
          clearInterval(timerChild); 
          setTimer(false);
          setTimerChild(false);
          const timerDataSession = {
            timer: 0,
            timer_id: '',
            company_id: ''
          };
          sessionStorage.setItem('timer', JSON.stringify(timerDataSession));

        }
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

    const formatHoursWorked = (seconds) => {

      var sec_num = parseInt(seconds, 10)
      var hours   = Math.floor(sec_num / 3600)
      var minutes = Math.floor(sec_num / 60) % 60
      var seconds = sec_num % 60;

      if(hours == 0 && minutes == 0) {
        var value = 'No time tracked yet for this current cycle';
      } else {
        var value = hours + ' hours and ' + minutes + ' minutes';
      }

      if (isNaN(hours) || isNaN(minutes)) {
        value = 'No time tracked yet for this current cycle';
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

    const filterTask = ({ name, dueComplete, hidden, is_deleted, is_completed, status_txt }) => {
      if (is_deleted) {
        return null;
      } else if(hiddenTasks) {
        if(status_txt == 'Hidden') {
          return name.toLowerCase().indexOf(searchValueTask.toLowerCase()) !== -1;
        }
      } else if(completedTasks) {
        if(status_txt == 'Completed') {
          return name.toLowerCase().indexOf(searchValueTask.toLowerCase()) !== -1;
        }
      } else if(ongoingTasks) {
        if(status_txt == 'Ongoing') {
          return name.toLowerCase().indexOf(searchValueTask.toLowerCase()) !== -1;
        }
      } else {
        if(status_txt != 'Hidden') {
          return name.toLowerCase().indexOf(searchValueTask.toLowerCase()) !== -1;
        }
      }
    };

    // List of tasks based on active client
    const listTasks = activeTasks.filter(filterTask).map(function(task, index) {
      return (
        <li key={index} onClick={() => chooseTask(task)} className={activeTaskTimer.id === task.id ? "taskTableDetails active" : (activeTask.id === task.id ? "taskTableDetails activeClick" : "taskTableDetails")}> 
          {activeTaskTimer.id === task.id ? (
  <span className="smallbtnblock">
    <img src={smallpause} className="play-sm" onClick={handleStartToggle} />
  </span>
) : (
  <span className="spaceblock"></span>
)}
          <span className="table-task">{task.name}<br /> {toHHMMSS(task.seconds_tracked)}</span> 
          <span className="table-date">{task.dateLastActivityFormat}</span>
          <span className="table-status">{task.status_txt}</span>
          <span className="table-due">{task.due_formated_desktop}</span>
          <span className="table-dots">
            <span className="dots" onClick={() => toggleDropdownTaskChecker(task)}>...</span>

            <div className={`dropdown-body task-dropdown ${task.is_open_dropdown && 'open'}`}>
              <div className="dropdown-item">
                <span onClick={() => hideTask()}>
                  {!task.hidden ? 
                      'Hide Task'
                  : 'Unhide Task'}
                </span>
              </div>
              <div className="dropdown-item">
                <span onClick={() => completedTask()}>
                {task.status_txt === 'Completed' ? 
                    'Set as Ongoing' :
                    'Set as Completed'
                }
                </span>
              </div>
              {task.url ? 
                <div className="dropdown-item">   
                  <span onClick={() => openTrelloLink(task.url)}>Open</span>
                </div>
               : ''}
              <div className="dropdown-item">
                <span onClick={() => deleteTask()}>
                  Delete Task
                </span>
              </div>
            </div>

          </span>
        </li>
      ); 
    }); 

    const showTasksClient = (
      <div>
        {listTasks.length > 0 ?
        <div>
          <div className="row tasks-lister">
            <div className="table-task">
              <span>Tasks</span>
            </div>
            <div className="table-date">
              <span>Date Created</span>
            </div>
            <div className="table-status">
              <span>Status</span>
            </div>
            <div className="table-due">
              <span>Due</span>
            </div>
            <div className="table-dots">
              <span></span>
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
              {userData.id == 7 ?
                <div className="dropdown-item" onClick={() => {  ipcRenderer.send('open-dev-tool'); }}>Open Dev Tool</div>
                : ''
              }
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
            <img src={rubii} className="logo" />
          </div>

          <div className="row">
            <div className="timer-clock">
            <div>{toHHMMSS(secondsDisplay)}</div> <span className="icon"></span>
            </div>
          </div>

          <div className="row project-task-showcase">

          {activeClient.avatar_url && activeClient.avatar_url.indexOf('default_avatar') === -1 && (
            <img src={activeClient.avatar_url} className="imgAvatar" />
          )}

            {timer && <div><h2 className="client-name"> {activeClientTimer.name}<span className="infobubble" onClick={toggleDropdownInfo}>i</span></h2></div>}
            {!timer && <div><h2 className="client-name"> {activeClient.name} <span className="infobubble" onClick={toggleDropdownInfo}>i</span></h2></div>}

            {activeClient.is_locked_monthly_cap == 1 && <div><h2 className="plan-reached"> Monthly Cap Reached</h2></div>}

            <div className={`dropdown-body bubble-dropdown ${isOpenInfo && 'open'}`}>
              <div className="dropdown-item">
                {timer && (
                  <div>
                    {activeClientTimer.start_subscription_period ? (
                      <span>
                        <span className="titlebubble">Billing Cycle</span><br />
                        {activeClientTimer.start_subscription_period} - {activeClientTimer.end_subscription_period}<br /><br />
                        <span className="titlebubble">Monthly Allocated Hours</span><br />
                        Up to {activeClientTimer.max_cap} hours / month<br /><br />
                        <span className="titlebubble">Worked Hours</span><br />
                        {formatHoursWorked(activeClientTimer.worked_seconds)}
                      </span>
                    ) : (
                      <>
                        <span className="titlebubble">Monthly Worked Hours</span><br />
                        {formatHoursWorked(activeClientTimer.worked_seconds)}
                      </>
                    )}
                    <br /><br />
                    <span className="titlebubble">Active Task</span><br />
                    <p className="task-name">{activeTaskTimer.name}</p>
                  </div>
                )}
                {!timer && (
                  <div>
                    {activeClient.start_subscription_period ? (
                      <p>
                        <span className="titlebubble">Billing Cycle</span><br />
                        {activeClient.start_subscription_period} - {activeClient.end_subscription_period}<br /><br />
                        <span className="titlebubble">Monthly Allocated Hours</span><br />
                        Up to {activeClient.max_cap} hours / month<br /><br />
                        <span className="titlebubble">Worked Hours</span><br />
                        {formatHoursWorked(activeClient.worked_seconds)}
                      </p>
                    ) : (
                      <>
                        <span className="titlebubble">Monthly Worked Hours</span><br />
                        {formatHoursWorked(activeClient.worked_seconds)}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {timer && <img src={pause} className="play" onClick={handleStartToggle} />}
            {!timer && <img src={play} className="play" onClick={handleStartToggle} />}
          </div>

          <div className="row project-task-showcase-search search-client">
            <input type="text" value={searchValueClient} onChange={e => setSearchValueClient(e.target.value)} className="search-bar" placeholder="Search Clients"/>
          </div>

          <div className="row list-clients">
              <span className="clientsName">Clients</span>
          </div>

          <div className="flexcroll flexcroll-mini">
            <div className="row">
                <ul className="list clients-display">
                  {listClients}
                </ul>
            </div>
          </div>

          <div onClick={handleRefresh} className="refreshIcon">
            <img src={refresh} className="refresh" /> <span className="text">Refresh</span>
          </div>

          <div className="version">
            Rubii v{pj.version}
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

            <div className="row addTask-row">
              <div className="addbox">
                <input type="text" className="bar addFieldInput" value={addToDoTask || ""} required placeholder="Add Task" onChange={e => setAddToDoTask(e.target.value)}/>
                <div className="addTaskBtn" onClick={addTask} disabled={loaderAddTask}>
                  +
                </div>
              </div>
              <div className="searchbox text-right">
                <input type="text" value={searchValueTask} onChange={e => setSearchValueTask(e.target.value)}  className="search-bar-tasks" placeholder="Search Tasks"/>
              </div>
              <div className="filterbox text-right">
                <select className="selectFilterOption" value={choosenFilterTask} onChange={e => chooseTaskFilter(e.target.value)}>
                  <option value="nameaz">By Name (A-Z)</option>
                  <option value="nameza">By Name (Z-A)</option>
                  <option value="dueasc">By Due Date (ASC)</option>
                  <option value="duedesc">By Due Date (DESC)</option>
                </select>
              </div>
              <div className="statusbox text-right">
                <select className="selectFilterOption" value={choosenStatusTask} onChange={e => chooseStatusFilter(e.target.value)}>
                  <option value="all">All Tasks</option>
                  <option value="ongoing">Ongoing Tasks</option>
                  <option value="completed">Completed Tasks</option>
                  <option value="hidden">Hidden Tasks</option>
                </select>
              </div>
            </div>

              {showTasksClient}

              {activeTask.id ?
                <div className="flexcroll chart-container">
                    <div className="fixed-bottom-task">
                      <div className="flex-display">
                        <div className="leftBottomDisplay">
                          <div className="block">
                            <strong>{activeTask.name}</strong>
                          </div>
                          <div className="block due-mrg">
                            <span>Due: {activeTask.dateLastActivityFormat}</span>
                          </div>
                        </div>
                        <div className="rightBottomDisplay">
                          <p><strong>{activeTask.status_txt}</strong></p>
                        </div>
                      </div>
                    {activeTask.desc ? <div dangerouslySetInnerHTML={{__html: activeTask.desc_for_html}}/>: 'No description'}</div>
                </div>
                : ''
              }
            
          </div>

        </div>

      </div>
      : <Spinner />
    }
    </div>
    );

    return (
      <div>
        {isLoggedIn && !loader ? deskTopApp
        : isLoggedIn && mainLoader ? <Spinner />
        : renderForm}
      </div>
    )
}

export default Login;