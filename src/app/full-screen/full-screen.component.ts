import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../services';
import { RouterExtensions } from 'nativescript-angular/router';
import { ImageSource } from 'tns-core-modules/image-source/image-source';
import { SwipeGestureEventData } from 'tns-core-modules/ui/gestures/gestures';

@Component({
  selector: 'ns-full-screen',
  templateUrl: './full-screen.component.html',
  styleUrls: ['./full-screen.component.css'],
  moduleId: module.id,
})
export class FullScreenComponent implements OnInit {

  constructor(public firebaseService: FirebaseService, private routerExtensions: RouterExtensions) { }
  myimage: ImageSource;
  ngOnInit() {
    this.firebaseService.myBase64$.forEach(data =>
      data.forEach(img => {
        this.myimage = img.name;
      })
    );
  }
  onSwipe(args: SwipeGestureEventData) {
    console.log(this.firebaseService.fullScreenImageIndex);
    if (args.direction === 1) {
      console.log(this.firebaseService.base64Images.length);
      if (this.firebaseService.fullScreenImageIndex === 0) {
        this.firebaseService.fullScreenImageIndex = this.firebaseService.base64Images.length - 1;
      } else {
        this.firebaseService.fullScreenImageIndex--;
      }
    } else {
      if (this.firebaseService.fullScreenImageIndex === this.firebaseService.base64Images.length - 1) {
        this.firebaseService.fullScreenImageIndex = 0;
      } else {
        this.firebaseService.fullScreenImageIndex++;
      }
    }
  }

}
