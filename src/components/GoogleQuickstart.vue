<template>
      <div class="row align-items-md-stretch">
        <div class="col-md-12">
          <div
            class="h-100 p-5 text-dark bg-light border rounded-3">
            <h2>Gophriend Finder</h2>
            <p>Find your future friends!</p>
            <button id="authorize_button" class="btn btn-outline-primary" @click="handleAuthClick">Authorize</button>
            <button v-if="events.length>0" id="fix_my_life" class="btn btn-outline-warning ms-1" @click="fixMyLife">Fix My Life</button>
            <div class="mt-3">
              <label for="filter" class="form-label">Filter out:</label>
              <input id="filter" type="text" class="form-control" v-model="userEmail" />
            </div>  
          </div>
        </div>
      </div>
      <div>
      <div class="row mt-3" v-if="content">
        <div class="col-md-6">
          <div class="p-5 h-100 text-dark bg-light border rounded-3">
            {{ content }}
            <p v-if="loadedResponse.result"><strong>{{  loadedResponse.result.items.length }}</strong> events found</p>
            <ul class="list-group list-group-flush">
              <li class="list-group-item m-1 rounded-1" v-for="person in getAttendees" :key="person">{{ person[1].name }} ({{ person[0] }} - {{  person[1].count }})</li>
            </ul>
          </div>
        </div>
          <div class="col-md-6" v-if="lifeContent">
            <div class="p-5 h-100 text-dark bg-light border rounded-3" v-html="lifeContent.replaceAll('\n', '<br>')">
            </div>
          </div>

          
        
      </div>
    
    
      </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed } from "vue";
  
  const CLIENT_ID = import.meta.env.VITE_CALENDAR_CLIENT;
  const API_KEY = '';
  const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
  const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';
  
  let tokenClient = null;
  let gapiInited = ref(false);
  let gisInited = ref(false);
  let content = ref("");
  let lifeContent = ref("");
  let userEmail = ref("mcfa0086@umn.edu");
  const loadGapiScript = () => {
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.onload = gapiLoaded;
    document.head.appendChild(script);
  };
  
  const loadGisScript = () => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = gisLoaded;
    document.head.appendChild(script);
  };
  
  const gapiLoaded = () => {
    gapi.load("client", initializeGapiClient);
  };
  
  const initializeGapiClient = async () => {
    await gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited.value = true;
    maybeEnableButtons();
  };
  
  const gisLoaded = () => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: handleTokenResponse,
    });
    gisInited.value = true;
    maybeEnableButtons();
  };
  
  const maybeEnableButtons = () => {
    if (gapiInited.value && gisInited.value) {
      document.getElementById("authorize_button").style.visibility = "visible";
    }
  };
  
  const handleAuthClick = async () => {
    tokenClient.callback = handleTokenResponse;
  
    if (gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: "consent" });
    } else {
      tokenClient.requestAccessToken({ prompt: "" });
    }
  };
  
  const tokenRecieved = ref(false);
  const handleTokenResponse = async (resp) => {
    tokenRecieved.value = true;
    if (resp.error !== undefined) {
      throw resp;
    }
    document.getElementById("authorize_button").innerText = "Refresh";
    await listUpcomingEvents();
  };
  
  const events = ref([]);
  const loadedResponse = ref([]);
  const listUpcomingEvents = async () => {
    let response;
    try {
        content.value = "Loading last year of events... this could take a while";
        // get the iso string date from one year ago
        let dateOneYearAgo = new Date();
        dateOneYearAgo.setFullYear(dateOneYearAgo.getFullYear() - 1);

        
        const request = {
            calendarId: "primary",
            timeMin:dateOneYearAgo.toISOString(),
            timeMax:new Date().toISOString(),
            showDeleted: false,
            singleEvents: true,
            maxResults: 30000,
            orderBy: "startTime",
        };
        loadedResponse.value = await gapi.client.calendar.events.list(request);
        // if there are multiple pages in the response, get the rest of the pages and combine them together
        while(loadedResponse.value.result.nextPageToken) {
            const request = {
                calendarId: "primary",
                timeMin:dateOneYearAgo.toISOString(),
                showDeleted: false,
                singleEvents: true,
                maxResults: 30000,
                orderBy: "startTime",
                pageToken: loadedResponse.value.result.nextPageToken
            };
            const nextPage = await gapi.client.calendar.events.list(request);
            loadedResponse.value.result.items = loadedResponse.value.result.items.concat(nextPage.result.items);
            loadedResponse.value.result.nextPageToken = nextPage.result.nextPageToken;
        }

    } catch (err) {
      content.value = err.message;
      return;
    }
    content.value = "Below are the top 10 people you've met with in a group, but never individually";
    events.value = loadedResponse.value.result.items;

};

// use the chatgpt api to review the events from the most recent month of april and get feedback on ways to imrpove scheduling efficiency
const fixMyLife = async () => {
  lifeContent.value = "Trying to fix your life. Give us a bit.";
  

  // also filter out any days on weekends
  const eventsForApril = eventsWithoutJustMe.value.filter(event => event.start.dateTime && event.start.dateTime.includes("-04-")).filter(event => {
    const date = new Date(event.start.dateTime);
    return date.getDay() !== 0 && date.getDay() !== 6;
  });
  const eventsForAprilString = eventsForApril.map(event => {
    let attendees = ""
    if(event.attendees) {
      attendees = event.attendees.filter(attendee => {
        return attendee.email !== userEmail.value && attendee.responseStatus == 'accepted';
      }).map(attendee => attendee.email).join(",");
    }
    if(attendees== "") {
      return;
    }
    return "Title: " + event.summary + "\n Start: " + event.start.dateTime + "\n End: " + event.end.dateTime + "\n Attendees: " + attendees + "\n\n";
  }).join(" ");
  const promptText = "Below is a summary of all of my calendar events from April. I'm finding that my work days are too busy, and I don't have time to get any actual work done. How you recommend I adjust my scheduling or approach to meetings to be more efficient or have more time to get work done? Please be specific and use examples based on the calendar items I've sent you. \n\n";
  const request = {
    "model": "gpt-3.5-turbo-16k",
    "messages": [{"role": "user", "content":promptText + eventsForAprilString}],
    // "temperature": 0.7,

  };
  lifeContent.value = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + import.meta.env.VITE_OPENAI_KEY
    },
    body: JSON.stringify(request)
  }).then(response => response.json()).then(response => response.choices[0].message.content);

}

const eventsWithoutJustMe = computed(() => {
    return events.value.filter(event => event.attendees && event.attendees.length > 1 && event.attendees.filter(attendee => (attendee.email == userEmail.value) && attendee.responseStatus == 'accepted').length > 0);
});
// events.value.forEach(event => {
//         if(event.attendees) {
//             let myEntry = event.attendees.filter(attendee => attendee.email == userEmail.value);
//             if(myEntry.length ==0 || myEntry[0].responseStatus != "accepted") {
//                 return;
//             }
const getAttendees = computed(() => {

    const justUs = events.value.reduce((acc, event) => {
      if(event.attendees && event.attendees.length === 2) {
        for(let i = 0; i < event.attendees.length; i++) {
            if(event.attendees[i].email !== userEmail.value) {
                acc.push(event.attendees[i].email);
            }
        }
      }
      return acc;
    }, []);
    const uniqueJustUs = [...new Set(justUs)];
    
    let filteredEvents = [];

    eventsWithoutJustMe.value.forEach(event => {
            filteredEvents.push(event.attendees.filter(attendee => attendee.email !== userEmail.value)
            .filter(attendee => attendee.responseStatus == "accepted")
            .filter(attendee => attendee.email.includes("@umn.edu"))
            .filter(attendee => !uniqueJustUs.includes(attendee.email)));
        }
    );
    
    const attendees = filteredEvents.reduce((acc, attendees) => {
        attendees.forEach(attendee => {
          if(acc[attendee.email]) {
            acc[attendee.email].count++;
          } else {
            acc[attendee.email] = {
              name: attendee.displayName,
              count: 1
            }
        }
        });
        return acc;      
    }, {});
    

    

    const notJustUs = Object.entries(attendees).sort((a, b) => b[1].count - a[1].count);

    return notJustUs.slice(0, 10);
});

    
  onMounted(() => {
    loadGapiScript();
    loadGisScript();
  });
  </script>