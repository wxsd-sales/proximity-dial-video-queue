/********************************************************
 * 
 * Author:              Taylor Hanson
 *                    	Solutions Engineers
 *                    	tahanson@cisco.com
 *                    	Cisco Systems
 * 
 * Co-Author:           William Mills
 *                    	Solutions Engineer
 *                    	wimills@cisco.com
 *                    	Cisco Systems
 * 
 * Version: 1-0-1
 * Released: 02/25/26
 * 
 * This is a Webex Device Macro which displays a video while 
 * waiting in a Webex Calling call queue:
 * 
 * Features:
 * 1. Provides easily configurable & self creating speed dial buttons
 * 2. Supports multiple call queues & video content display
 * 3. Can auto hide/unhide Call control UI in and out of call
 * 
 * Requirements:
 * 1. Webex Device must be provisioned with a Webex Calling subscription
 * 2. A call queue must be setup on control hub and its number added to the macro
 * 3. Agents must be added to the call queue so the call can be answered
 * 
 * Full Readme and source code available on Github:
 * https://github.com/wxsd-sales/video-queue-macro
 * 
 ********************************************************/
import xapi from 'xapi';

/*********************************************************
 * Configure the settings below
**********************************************************/

const config = {
  buttons: [        // Array of buttons, will be auto added to the device
    {
      name: 'Call For Assistance',
      icon: 'Concierge',
      color: '#0000ff',
      target: '11112'
    }
    // Add your additional speed dial buttons here
  ],
  queues: [       // Array of queues to monitor and display commercials
    {
      title: 'Please wait 😊', // The title which is display when in modal mode
      number: '11112', // Number to monitor
      url: 'https://wxsd-sales.github.io/proximity-dial-video-queue/',  // URL to display
      mode: 'Fullscreen',       // Fullscreen | Modal
      target: 'OSD'     // OSD | Controller
    }
    // Add your additional queue monitoring settings here
  ],
  hideUI: false, // true = hide out of call controls, false = show controls
  hideIncallUI: false,  // true = hide in call call controls, false = show controls
  clearWebData: true,  // Clear Web Data after call has ended
  panelId: 'call-queue',  // Our base Panel Id for all speed dial buttons
  prompt: {
    waitTime: 10,
    title: `Person Detected`,
    text: ['Your call will begin in ', ' seconds'],
    panelId: 'proximity-calling'
  }
}


/*********************************************************
 * Below contains all macros functions
**********************************************************/


let clearCache = false;

//Create our speed dial buttons
config.buttons.forEach((button, i) => createPanel(button, i))

// Subscribe to Events & Status changes
xapi.Status.Call['*'].ghost.on(processCallGhost);
xapi.Event.UserInterface.Extensions.Panel.Clicked.on(processClicks)
xapi.Status.SystemUnit.State.NumberOfActiveCalls.on(processCallCount);
xapi.Status.Call.RemoteNumber.on(processRemoteNumber)

createWarningPanel(config.prompt)
xapi.Config.RoomAnalytics.PeopleCountOutOfCall.set('On');
xapi.Config.RoomAnalytics.PeoplePresenceDetector.set('On');
xapi.Status.RoomAnalytics.Engagement.CloseProximity.on(state => processChange('CloseProximity', state));
xapi.Status.RoomAnalytics.PeopleCount.Current.on(state => processChange('PeopleCount', state));
xapi.Event.UserInterface.Extensions.Panel.Close.on(monitorPanel);
xapi.Event.UserInterface.Extensions.Widget.Action.on(processWidget);

// Initially chech the number of calls to set the UI config
xapi.Status.SystemUnit.State.NumberOfActiveCalls.get()
  .then(r => processCallCount(r))

function processCallCount(event) {
  console.log('Number of calls: ' + event)
  if (event == 0) {
    hideCommercial();
    setUIVisability(!config.hideUI)
  } else {
    setUIVisability(!config.hideIncallUI)
  }
}

function processCallGhost() {
  hideCommercial();
  if (clearCache) {
    clearCache = false;
    clearWebCache();
    setTimeout(clearWebCache, 200);
  }
}

function processRemoteNumber(event) {
  console.log(`Remote Number [${event}]`)
  // Check if a monitoring number is present
  const match = config.queues.find(queue => event.startsWith(queue.number))
  // Ignore calls with not matched number
  if (!match) {
    console.log('No number matched');
    hideCommercial();
    return;
  }
  showCommercial(match)
}

function processClicks(event) {
  // Ignore all button presses which don't begin with our panelId
  if (!event.PanelId.startsWith(config.panelId)) return;
  // Get the panelId number and match to our button array.
  const index = event.PanelId.substr(config.panelId.length);
  console.log(`Button [${config.buttons[index].name}] clicked`)
  // Dial the target associated with button
  dial(config.buttons[index].target)
}

function showCommercial({ title, url, mode, target }) {
  if (config.clearWebData) clearCache = true;
  console.log(`Opening Webview on [${target}] - Title: ${title} | Mode: ${mode} | Url: ${url}`)
  xapi.Command.UserInterface.WebView.Display(
    { Mode: mode, Target: target, Title: title, Url: url })
    .catch(e => console.log('Error opening webview: ' + e.message))
}

function hideCommercial() {
  console.log('Hiding Any Commerical')
  xapi.Command.UserInterface.WebView.Clear();
}

function clearWebCache() {
  console.log('Clearing Web Cache')
  xapi.Command.WebEngine.DeleteStorage({ Type: 'WebApps' });
}

function setUIVisability(state) {
  console.log('Setting UI Visability to: ' + state)
  xapi.Config.UserInterface.Features.HideAll.set(state ? 'False' : 'True');
}

function dial(number) {
  console.log(`Dialing number [${number}]`);
  xapi.Command.Dial({ Number: number })
    .catch(e => console.log(`Unable to dial [${number}] - Error: ${e.message}`))
}

/*********************************************************
 * Main functions and event subscriptions
**********************************************************/

let interval = null;
let timeRemaining = null;
let suspend = false;

async function processChange(type, state) {
  if(suspend) return;

  const calls = await xapi.Status.SystemUnit.State.NumberOfActiveCalls.get();
  if (calls > 0) return;

  let close = null;
  let count = null;

  switch (type) {
    case 'CloseProximity':
      close = state;
      count = await xapi.Status.RoomAnalytics.PeopleCount.Current.get();
      break;
    case 'PeopleCount':
      count = state;
      close = await xapi.Status.RoomAnalytics.Engagement.CloseProximity.get()
      break;
  }

  if ((count < 1 || close == 'False') && interval != null) {
    stopCountDown();
    console.log(`Count [${count}] - Close [${close}] - Change Type [${type}] - Detection Ended, resetting timer`);
    return;
  } else if (count > 0 && close == 'True' && interval == null) {
    startCountDown();
    console.log(`Count [${count}] - Close [${close}] - Change Type [${type}] - New detection detected, starting timer`);
    return;
  } else {
    console.log(`Count [${count}] - Close [${close}] - Change Type [${type}] - Ignoring`);
    return;
  }
}

function monitorPanel(event){
  console.log('Panel Closed - TimeRemaining', timeRemaining)
  if(event.PanelId != config.prompt.panelId) return;
  if(timeRemaining == null) return;
  console.log('Reopening panel')
  openPanel();
}

function processWidget(event){
  if(event.Type != 'clicked' && event.WidgetId != config.prompt.panelId ) return;
  stopCountDown();
  suspendMonitoring(60);
}

function suspendMonitoring(seconds){
  suspend = true;
  console.log(`${config.prompt.title} suspended for ${seconds} seconds`)
  setTimeout(()=>{
    suspend = false;
    console.log(`${config.prompt.title} suspension finished, monitioring again`)
  }, seconds * 1000)
}

async function startCountDown(){
  timeRemaining = config.prompt.waitTime;
  await xapi.Command.Standby.Deactivate();
  await updateText(config.prompt.waitTime);
  await openPanel();
  interval = setInterval(countDown, 1000)
}

function stopCountDown(){
  clearInterval(interval)
  interval = null;
  closePanel();
}

function countDown() {
  if (timeRemaining == 0 && !suspend) {
    stopCountDown();
    placeCall();
  } else {
    timeRemaining = timeRemaining - 1;
    updateText(timeRemaining)
  }
}

function openPanel() {
  return xapi.Command.UserInterface.Extensions.Panel.Open({ PanelId: config.prompt.panelId })
}

function closePanel() {
  xapi.Command.UserInterface.Extensions.Panel.Close();
}

async function placeCall() {
  const calls = await xapi.Status.SystemUnit.State.NumberOfActiveCalls.get();
  if (calls > 0) {
    console.log(`Timer for dialling destination return`)
    return;
  }
  dial(config.buttons[0].target)
}

function updateText(text){
  text = `${config.prompt.text[0]} ${text} ${config.prompt.text[1]}`;
  console.log(`Updating Text [${text}]`)
  return xapi.Command.UserInterface.Extensions.Widget.SetValue(
    { Value: text, WidgetId: config.prompt.panelId+'-text' });
}

async function createWarningPanel(prompt){
  const panel = `<Extensions><Panel>
                  <Location>Hidden</Location>
                  <Name>${prompt.title}</Name>
                  <ActivityType>Custom</ActivityType>
                  <Page>
                    <Name>${prompt.title}</Name>
                    <Row><Widget>
                        <WidgetId>${prompt.panelId}-text</WidgetId>
                        <Name>${prompt.text[0]} ${prompt.waitTime} ${prompt.text[1]}</Name>
                        <Type>Text</Type>
                        <Options>size=4;fontSize=normal;align=center</Options>
                    </Widget></Row>
                    <Row><Widget>
                        <WidgetId>${prompt.panelId}-cancel</WidgetId>
                        <Name>Cancel</Name>
                        <Type>Button</Type>
                        <Options>size=2</Options>
                    </Widget></Row>
                    <Options>hideRowNames=1</Options>
                  </Page>
                </Panel></Extensions>`;
  return xapi.Command.UserInterface.Extensions.Panel.Save({ PanelId: prompt.panelId }, panel);
} 

async function createPanel(button, i) {
  const orderNum = await panelOrder(config.panelId + i)
  const order = (orderNum != -1) ? `<Order>${orderNum}</Order>` : '';

  const panel = `
    <Extensions>
      <Panel>
        <Type>Statusbar</Type>
        <Location>HomeScreen</Location>
        <Icon>${button.icon}</Icon>
        <Color>${button.color}</Color>
        <Name>${button.name}</Name>
        ${order}
        <ActivityType>Custom</ActivityType>
      </Panel>
    </Extensions>`
  xapi.Command.UserInterface.Extensions.Panel.Save(
    { PanelId: config.panelId + i },
    panel
  )
    .catch(e => console.log('Error saving panel: ' + e.message))
}

// This function finds the place order of the panel if it was saved previously
async function panelOrder(panelId) {
  const list = await xapi.Command.UserInterface.Extensions.List({ ActivityType: 'Custom' });
  if (!list.hasOwnProperty('Extensions')) return -1
  if (!list.Extensions.hasOwnProperty('Panel')) return -1
  if (list.Extensions.Panel.length == 0) return -1
  for (let i = 0; i < list.Extensions.Panel.length; i++) {
    if (list.Extensions.Panel[i].PanelId == panelId) return list.Extensions.Panel[i].Order;
  }
  return -1
}