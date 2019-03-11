import { NgModule } from "@angular/core";
import { NativeScriptRouterModule } from "nativescript-angular/router";
import { Routes } from "@angular/router";

import { ItemsComponent } from "./item/items.component";
import { LoginComponent } from "./auth/login/login.component";
import { AuthGuard } from "./auth/auth-guard.service";
import { ImagesComponent } from "./images/images.component";

const routes: Routes = [
    { path: "", component: ItemsComponent },
    { path: "login", component: LoginComponent },
    { path: "images", component: ImagesComponent, canActivate: [AuthGuard] },
    { path: "items", component: ItemsComponent }
];

@NgModule({
    imports: [NativeScriptRouterModule.forRoot(routes)],
    exports: [NativeScriptRouterModule]
})
export class AppRoutingModule { }