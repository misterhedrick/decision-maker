import { NgModule } from "@angular/core";
import { NativeScriptRouterModule } from "nativescript-angular/router";
import { Routes } from "@angular/router";

import { ItemsComponent } from "./item/items.component";
import { ItemDetailComponent } from "./item/item-detail.component";
import { LoginComponent } from "./auth/login/login.component";
import { AuthGuard } from "./auth/auth-guard.service";

const routes: Routes = [
    { path: "", component: ItemsComponent, canActivate: [AuthGuard] },
    { path: "login", component: LoginComponent },
    { path: "items", component: ItemsComponent, canActivate: [AuthGuard] },
    { path: "item/:id", component: ItemDetailComponent, canActivate: [AuthGuard] },
];

@NgModule({
    imports: [NativeScriptRouterModule.forRoot(routes)],
    exports: [NativeScriptRouterModule]
})
export class AppRoutingModule { }