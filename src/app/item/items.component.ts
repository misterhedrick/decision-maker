import { Component, OnInit, AfterViewInit, AfterViewChecked } from "@angular/core";

import { Item } from "./item";
import { ItemService } from "./item.service";
import { FirebaseService } from "../services/firebase.service";
import { Router } from "@angular/router";
import { RouterExtensions } from 'nativescript-angular/router/router-extensions';
import { alert, login } from "tns-core-modules/ui/dialogs";
import { prompt } from "tns-core-modules/ui/dialogs";
import { SwipeGestureEventData } from "tns-core-modules/ui/gestures/gestures";
import { BackendService } from "../services/backend.service";
import { User } from "../models";

@Component({
    selector: "ns-items",
    moduleId: module.id,
    templateUrl: "./items.component.html",
})
export class ItemsComponent implements OnInit {
    items: Item[];
    isLoggingIn = true;
    isAuthenticated = false;
    constructor(private itemService: ItemService, private routerExtensions: RouterExtensions, public firebaseService: FirebaseService,
        private router: Router, public bs: BackendService) { }

    ngOnInit() {
        this.bs.mainUserExists().then((data) => {
            if (data != '') {
                this.isAuthenticated = true;
                this.firebaseService.setEmail(data).then(() => {
                    this.firebaseService.getRestaurantsObservable();
                });
            } else {
                this.isAuthenticated = false;
            }
        });
    }
    logout() {
        this.firebaseService.logout();
        this.routerExtensions.navigate(["/"], { clearHistory: true });
    }
    login() {
        login({
            title: "Login",
            message: "Enter your user and pw",
            okButtonText: "Login",
            cancelButtonText: "Cancel",
            userName: this.firebaseService.email,
            password: ""
        }).then((data) => {
            if (data.result) {
                this.firebaseService.login(data.userName, data.password)
                    .then(() => {
                        this.isAuthenticated = true;
                        this.routerExtensions.navigate(["/images"], { clearHistory: true });
                    })
                    .catch((message: any) => {
                        this.isAuthenticated = false;
                    });
            }
        });
    }
    createUser() {
        login({
            title: "Create User",
            message: "Enter your user and pw",
            okButtonText: "Create",
            cancelButtonText: "Cancel",
            userName: "",
            password: ""
        }).then((data) => {
            if (data.result) {
                let tempuser = new User();
                tempuser.email = data.userName;
                tempuser.password = data.password;
                this.signUp(tempuser).then((success) => {
                    if (success) {
                        this.firebaseService.setEmail(data.userName).then(() => {
                            this.isAuthenticated = true;
                            this.firebaseService.getRestaurantsObservable();
                        })
                    }
                });
            }
        });
    }
    signUp(user: User): Promise<boolean> {
        return new Promise((resolve) => {
            this.firebaseService.register(user)
                .then((data) => {
                    if (data) {
                        this.bs.createNewUser('mainuser', user);
                        resolve(true);
                    } else {
                        resolve(false)
                    }
                })
                .catch((message: any) => {
                    alert(message);
                });

        });
    }

    navigate() {
        this.routerExtensions.navigate(["/images"], { clearHistory: true });
    }
    choose() {
        let itemNumber = Math.floor(Math.random() * (this.firebaseService.restaurants.length));
        alert({
            title: this.firebaseService.restaurants[itemNumber].name,
            okButtonText: "Ok",
        });
    }

    onSwipe(args: SwipeGestureEventData, id: string) {
        if (args.direction === 2) {
            this.firebaseService.firestoreDelete('restaurants', id);
        }
    }

    editItem(item: Item) {
        prompt({
            title: "New Item Name",
            okButtonText: "Ok",
            cancelButtonText: "Cancel"
        }).then((data) => {
            if (data.result) {
                this.firebaseService.firestoreUpdate('restaurants', item.id, data.text.trim())
            }
        });
    }

    addItem() {
        prompt({
            title: "Item Name",
            okButtonText: "Ok",
            cancelButtonText: "Cancel"
        }).then((data) => {
            if (data.result) {
                this.firebaseService.addRestaurant('restaurants', data.text.trim())
            }
        });
    }
}