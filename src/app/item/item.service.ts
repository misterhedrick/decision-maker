import { Injectable } from "@angular/core";

import { Item } from "./item";

@Injectable({
    providedIn: "root"
})
export class ItemService {
    private items = new Array<Item>(
        { id: '1', name: "Outback", role: "Goalkeeper" },
        { id: '2', name: "Table", role: "Goalkeeper" },
        { id: '3', name: "Texas Roadhouse", role: "Defender" },
        { id: '4', name: "Sir Pizza", role: "Midfielder" },
        { id: '5', name: "Las Trancas", role: "Midfielder" },
        { id: '6', name: "Chilis", role: "Midfielder" },
        { id: '7', name: "Kickback Jacks", role: "Midfielder" },
        { id: '8', name: "Everything Under The Bun", role: "Midfielder" },
        { id: '9', name: "Hops", role: "Forward" }
    );

    getItems(): Item[] {
        return this.items;
    }

    getItem(id: number): Item {
        //return this.items.filter(item => item.id === id)[0];
        return this.items[0];
    }
}
