// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import UnionCommand from "./UnionCommand";


const { ccclass, property } = cc._decorator;

@ccclass
export default class UnionCreateLogic extends cc.Component {

    @property(cc.EditBox)
    editName: cc.EditBox = null;


    protected onLoad():void{
        cc.systemEvent.on("create_union_success",this.onClickClose,this)
        this.editName.string = this.getRandomName(6);
    }


    protected onCreate() {
        UnionCommand.getInstance().unionCreate(this.editName.string);
    }


    protected onRandomName():void{
        this.editName.string = this.getRandomName();
    }


    protected getRandomName():string{
        let name = ""
        var firstname:string[] = ["李","西门","沈","张","上官","司徒","欧阳","轩辕","咳咳","妈妈"];
        var nameq:string[] = ["彪","巨昆","锐","翠花","小小","撒撒","熊大","宝强"];
        var xingxing = firstname[Math.floor(Math.random() * (firstname.length))];
        var mingming = nameq[Math.floor(Math.random() * (nameq.length))];
        name = xingxing + mingming;
         return name
     }



    protected onDestroy():void{
        cc.systemEvent.targetOff(this);
    }

    protected onClickClose(): void {
        this.node.active = false;
    }
}