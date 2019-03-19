// this import should be first in order to load some required settings (like globals and reflect-metadata)
import { platformNativeScriptDynamic } from "nativescript-angular/platform";

import { AppModule } from "./app/app.module";
import { BackendService } from "./app/services/backend.service";

import { firebase } from 'nativescript-plugin-firebase/firebase-common';
firebase.init({
  //persist should be set to false as otherwise numbers aren't returned during livesync
  persist: false,
  storageBucket: 'gs://decision-maker-app.appspot.com',
  onAuthStateChanged: (data: any) => {
    console.log(JSON.stringify(data))
    if (data.loggedIn) {
      BackendService.token = data.user.uid;
    }
    else {
      BackendService.token = "";
    }
  }
}).then(
  function (instance) {
  },
  function (error) {
  }
);
platformNativeScriptDynamic().bootstrapModule(AppModule);
