import MapResBuildLogic from "../map/MapResBuildLogic";
import MapBuildWarFreeLogic from "../map/MapBuildWarFreeLogic";
import MapCityLogic from "../map/MapCityLogic";
import { MapCityData } from "../map/MapCityProxy";
import MapCommand from "../map/MapCommand";
import MapLogic from "../map/MapLogic";
import { MapAreaData, MapResType } from "../map/MapProxy";
import MapResLogic from "../map/MapResLogic";
import MapUtil from "../map/MapUtil";
import MapBuildLogic from "../map/MapBuildLogic";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapScene extends cc.Component {
    @property(cc.Node)
    mapLayer: cc.Node = null;
    @property(cc.Node)
    resLayer: cc.Node = null;
    @property(cc.Node)
    buildLayer: cc.Node = null;
    @property(cc.Node)
    armyLayer: cc.Node = null;

    protected _cmd: MapCommand = null;
    protected _centerX: number = 0;
    protected _centerY: number = 0;
    protected _lastUpPosTime: number = 0;

    protected onLoad(): void {
        this._cmd = MapCommand.getInstance();

        //初始化地图
        let tiledMap: cc.TiledMap = this.mapLayer.addComponent(cc.TiledMap);
        tiledMap.tmxAsset = this._cmd.proxy.tiledMapAsset;
        MapUtil.initMapConfig(tiledMap);
        this._cmd.initData();
        cc.systemEvent.on("map_show_area_change", this.onMapShowAreaChange, this);
        cc.systemEvent.on("scroll_to_map", this.onScrollToMap, this);
        this.scheduleOnce(() => {
            let myCity: MapCityData = this._cmd.cityProxy.getMyMainCity();
            this.node.getComponent(MapLogic).setTiledMap(tiledMap);
            this.node.getComponent(MapLogic).scrollToMapPoint(cc.v2(myCity.x, myCity.y));
            this.onTimer();//立即执行一次
        });
        this.schedule(this.onTimer, 0.2);
    }

    protected onDestroy(): void {
        cc.systemEvent.targetOff(this);
        this._cmd.proxy.clearData();
        this._cmd = null;
    }

    protected onTimer(): void {

        if (this._cmd.proxy.qryAreaIds && this._cmd.proxy.qryAreaIds.length > 0) {
            let qryIndex: number = this._cmd.proxy.qryAreaIds.shift();
            let qryData: MapAreaData = this._cmd.proxy.getMapAreaData(qryIndex);
            if (qryData.checkAndUpdateQryTime()) {
                this._cmd.qryNationMapScanBlock(qryData);
            }
        }
        let nowTime: number = Date.now();
        if (nowTime - this._lastUpPosTime > 1000) {
            this._lastUpPosTime = nowTime;
            //间隔一秒检测中心点是否改变
            let point: cc.Vec2 = MapCommand.getInstance().proxy.getCurCenterPoint();
            if (point != null && (this._centerX != point.x || this._centerY != point.y)) {
                this._centerX = point.x;
                this._centerY = point.y;
                MapCommand.getInstance().upPosition(point.x, point.y);
            }
        }
    }

    protected onMapShowAreaChange(centerPoint: cc.Vec2, centerAreaId: number, addIds: number[], removeIds: number[]): void {
        console.log("map_show_area_change", arguments);
        let resLogic: MapResLogic = this.node.getComponent(MapResLogic);
        let buildResLogic: MapResBuildLogic = this.node.getComponent(MapResBuildLogic);
        let buildLogic: MapBuildLogic = this.node.getComponent(MapBuildLogic);
        let buildWarFreeLogic: MapBuildWarFreeLogic = this.node.getComponent(MapBuildWarFreeLogic);
        let cityLogic: MapCityLogic = this.node.getComponent(MapCityLogic);

        //更新展示区域
        resLogic.udpateShowAreas(addIds, removeIds);
        buildResLogic.udpateShowAreas(addIds, removeIds);
        buildLogic.udpateShowAreas(addIds, removeIds);
        buildWarFreeLogic.udpateShowAreas(addIds, removeIds);
        cityLogic.udpateShowAreas(addIds, removeIds);

        //更新区域内的具体节点
        for (let i: number = 0; i < addIds.length; i++) {
            let areaData: MapAreaData = this._cmd.proxy.getMapAreaData(addIds[i]);
            // console.log("areaData", areaData);
            for (let x: number = areaData.startCellX; x < areaData.endCellX; x++) {
                for (let y: number = areaData.startCellY; y < areaData.endCellY; y++) {
                    let cellId: number = MapUtil.getIdByCellPoint(x, y);
                    //资源
                    if (this._cmd.proxy.getResData(cellId).type >= MapResType.WOOD) {
                        resLogic.addItem(addIds[i], this._cmd.proxy.getResData(cellId));
                    }
                    //建筑
                    if (this._cmd.buildProxy.getBuild(cellId) != null) {
                        buildLogic.addItem(addIds[i], this._cmd.buildProxy.getBuild(cellId));
                    }
                    //城池
                    if (this._cmd.cityProxy.getCity(cellId) != null) {
                        cityLogic.addItem(addIds[i], this._cmd.cityProxy.getCity(cellId));
                    }
                }
            }
        }
    }

    protected onScrollToMap(x: number, y: number): void {
        this.node.getComponent(MapLogic).scrollToMapPoint(cc.v2(x, y));
    }
}
