import { Injectable } from "@angular/core";
import { Router, CanActivate } from "@angular/router";

import { BackendService } from "../services/backend.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private router: Router, public bs: BackendService) { }

  canActivate() {
    if (this.bs.isLoggedIn()) {
      return true;
    }
    else {
      this.router.navigate(["/items"]);
      return false;
    }
  }
}