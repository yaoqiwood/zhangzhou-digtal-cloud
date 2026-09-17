// Mock服务管理

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const ALPHA_NUM = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const PROVINCES = ['闽', '粤', '浙', '赣', '苏', '湘', '桂', '鄂', '贵', '沪'];
let vehJamExtraCount = 0;
let jamRoadExtraCount = 0;
let trafficEventIncrementCount = 0;

const VEH_JAM_SECTIONS = [
  {
    Flagid: '340833-4509EX',
    sectionName: '蒲峰枢纽至仙游龙华-福建仙游龙华站',
    stakeNum: 'G1523 AK799+880',
    baseFlow: 46,
    baseSpeed: 5.8,
  },
  {
    Flagid: '340B0B-4406EX',
    sectionName: '涵江庄边至仙游游洋-福建仙游游洋站',
    stakeNum: 'G1517 AK66+720',
    baseFlow: 13,
    baseSpeed: 56.4,
  },
  {
    Flagid: '341A12-341A13',
    sectionName: '仙游西乡至仙游大济-仙游大济至永春湖洋',
    stakeNum: 'S55 AK72+590-S55 AK76+000',
    baseFlow: 15,
    baseSpeed: 18.8,
  },
  {
    Flagid: '351A09-351A07',
    sectionName: '莆田华亭至莆田西-莆田西至西埔枢纽',
    stakeNum: 'S55 BK39+880-S55 BK26+000',
    baseFlow: 32,
    baseSpeed: 40.6,
  },
  {
    Flagid: '351A0B-351A09',
    sectionName: '仙游盖尾至莆田华亭-莆田华亭至莆田西',
    stakeNum: 'S55 BK52+750-S55 BK39+880',
    baseFlow: 19,
    baseSpeed: 61.5,
  },
  {
    Flagid: '350B08-350B07',
    sectionName: '涵江白沙至涵江萩芦-涵江萩芦至涵江江口',
    stakeNum: 'G1517 BK56+112-G1517 BK39+650',
    baseFlow: 42,
    baseSpeed: 70.9,
  },
  {
    Flagid: '341A11-341A12',
    sectionName: '蒲峰枢纽至仙游西乡-仙游西乡至仙游大济',
    stakeNum: 'S55 AK71+470-S55 AK72+590',
    baseFlow: 14,
    baseSpeed: 3.1,
  },
  {
    Flagid: '350831-35082F',
    sectionName: '蒲峰枢纽至仙游榜头-仙游榜头至仙游菜溪',
    stakeNum: 'G1523 BK788+750-G1523 BK773+950',
    baseFlow: 34,
    baseSpeed: 65,
  },
  {
    Flagid: '351A0D-351A0B',
    sectionName: '仙游城区至仙游盖尾-仙游盖尾至莆田华亭',
    stakeNum: 'S55 BK58+250-S55 BK52+750',
    baseFlow: 16,
    baseSpeed: 28.8,
  },
  {
    Flagid: '350B09-350B08',
    sectionName: '涵江庄边至涵江白沙-涵江白沙至涵江萩芦',
    stakeNum: 'G1517 BK64+750-G1517 BK56+112',
    baseFlow: 19,
    baseSpeed: 42.2,
  },
  {
    Flagid: '340B08-340B09',
    sectionName: '涵江萩芦至涵江白沙-涵江白沙至涵江庄边',
    stakeNum: 'G1517 AK56+074-G1517 AK64+720',
    baseFlow: 20,
    baseSpeed: 36.5,
  },
  {
    Flagid: '341A07-341A09',
    sectionName: '西埔枢纽至莆田西-莆田西至莆田华亭',
    stakeNum: 'S55 AK25+970-S55 AK39+850',
    baseFlow: 11,
    baseSpeed: 41.2,
  },
  {
    Flagid: '351A0F-351A0D',
    sectionName: '蒲峰枢纽至仙游城区-仙游城区至仙游盖尾',
    stakeNum: 'S55 BK59+720-S55 BK58+250',
    baseFlow: 12,
    baseSpeed: 7.8,
  },
  {
    Flagid: '341A0F-350831',
    sectionName: '仙游城区至蒲峰枢纽-蒲峰枢纽至仙游榜头',
    stakeNum: 'S55 AK59+630-G1523 BK788+750',
    baseFlow: 17,
    baseSpeed: 65.1,
  },
  {
    Flagid: '351A03-4501EX',
    sectionName: '秀屿至莆田忠门-福建湄洲岛站',
    stakeNum: 'S55 BK12+530',
    baseFlow: 7,
    baseSpeed: 28.6,
  },
  {
    Flagid: '340B07-340B08',
    sectionName: '涵江江口至涵江萩芦-涵江萩芦至涵江白沙',
    stakeNum: 'G1517 AK39+620-G1517 AK56+074',
    baseFlow: 12,
    baseSpeed: 78.3,
  },
  {
    Flagid: '35082F-35082D',
    sectionName: '仙游榜头至仙游菜溪-仙游菜溪至五星枢纽',
    stakeNum: 'G1523 BK773+950-G1523 BK772+480',
    baseFlow: 10,
    baseSpeed: 12.3,
  },
  {
    Flagid: '350B07-350B05',
    sectionName: '涵江萩芦至涵江江口-涵江江口至港后枢纽',
    stakeNum: 'G1517 BK39+650-G1517 BK38+400',
    baseFlow: 10,
    baseSpeed: 6.5,
  },
  {
    Flagid: '341A09-341A0B',
    sectionName: '莆田西至莆田华亭-莆田华亭至仙游盖尾',
    stakeNum: 'S55 AK39+850-S55 AK52+700',
    baseFlow: 24,
    baseSpeed: 63.4,
  },
  {
    Flagid: '351A11-351A0F',
    sectionName: '仙游西乡至蒲峰枢纽-蒲峰枢纽至仙游城区',
    stakeNum: 'S55 BK71+500-S55 BK59+720',
    baseFlow: 23,
    baseSpeed: 56.5,
  },
  {
    Flagid: '341A0D-4505EX',
    sectionName: '仙游盖尾至仙游城区-福建仙游城区站',
    stakeNum: 'S55 AK58+220',
    baseFlow: 10,
    baseSpeed: 10,
  },
  {
    Flagid: '351A05-351A03',
    sectionName: '西埔枢纽至秀屿-秀屿至莆田忠门',
    stakeNum: 'S55 BK14+330-S55 BK12+530',
    baseFlow: 5,
    baseSpeed: 33,
  },
  {
    Flagid: '350B03-4401EX',
    sectionName: '三江口枢纽至荔城北高-福建秀屿埭头站',
    stakeNum: 'G1517 BK13+600',
    baseFlow: 7,
    baseSpeed: 56.9,
  },
  {
    Flagid: '341A0B-341A0D',
    sectionName: '莆田华亭至仙游盖尾-仙游盖尾至仙游城区',
    stakeNum: 'S55 AK52+700-S55 AK58+220',
    baseFlow: 4,
    baseSpeed: 30.9,
  },
];

const SLOW_CONGESTION_EVENT_SAMPLE = {
  Flagid: '350B09-350B08',
  avgSpeed: 58.2,
  congestionStatus: '缓行',
  downstreamVehicles: 8,
  sectionName: '涵江庄边至涵江白沙-涵江白沙至涵江萩芦',
  stakeNum: 'G1517 BK64+750-G1517 BK56+112',
  strandedGuests: 3,
  strandedTrucks: 4,
  strandedVehicles: 7,
  time: '2026-04-16 15:20:08',
  totalVehicles: 11,
  type: '缓行',
  upstreamVehicles: 0,
};

const TRAFFIC_EVENT_SEED_MAP = {
  1766233475454474: [
    {
      content:
        '2025年12月20日20时22分，G1517线莆炎高速莆田涵江段BK57处白沙服务区暂停供油，预计恢复时间等待通知，相关情报板已发布提示信息。',
      direction: 'B方向',
      endTime: '',
      eventLve: '一般事件',
      eventNo: '1766233475454474',
      eventStatus: '执行中',
      eventType: '其他紧急事件',
      handleContent: '',
      happenTime: '2025-12-20 20:22:34',
      isEnd: '',
      isTunnel: '否',
      kmEnd: 'K57+0',
      kmStart: 'K57+0',
      lat: '25.57413',
      lon: '119.04986',
      orgName: '莆田分公司',
      route: 'G1517',
      routeName: '莆炎高速',
    },
  ],
  1769446601586393: [
    {
      content:
        '00:56 接湄洲岛所上报：二轮车（3部）从9道（人工车道）非法闯入上高速 ，往莆田方向；00:57 已通知高速交警、高速执法。',
      direction: 'A方向',
      endTime: '',
      eventLve: '一般事件',
      eventNo: '1769446601586393',
      eventStatus: '执行中',
      eventType: '其他紧急事件',
      handleContent: '',
      happenTime: '2026-01-27 00:56:36',
      isEnd: '',
      isTunnel: '否',
      kmEnd: 'K1+0',
      kmStart: 'K1+0',
      lat: '25.16793',
      lon: '119.11545',
      orgName: '莆田分公司',
      route: 'S55',
      routeName: '秀永高速',
    },
  ],
  1770788620696665: [
    {
      content:
        '13:43，经视频图像巡查，S55线秀永高速莆田段AK76+625处（过仙游大济收费站约1公里），路面上有行人（1人），目前在护栏外，13:44 已通知高速交警、高速执法。',
      direction: 'A方向',
      endTime: '',
      eventLve: '一般事件',
      eventNo: '1770788620696665',
      eventStatus: '执行中',
      eventType: '其他紧急事件',
      handleContent: '',
      happenTime: '2026-02-11 13:43:34',
      isEnd: '',
      isTunnel: '否',
      kmEnd: 'K76+625',
      kmStart: 'K76+625',
      lat: '25.382342575701898',
      lon: '118.57962573010344',
      orgName: '莆田分公司',
      route: 'S55',
      routeName: '秀永高速',
    },
  ],
  1771460888983266: [
    {
      content: '反映路面上有小车逆行',
      direction: 'A方向',
      endTime: '',
      eventLve: '一般事件',
      eventNo: '1771460888983266',
      eventStatus: '执行中',
      eventType: '其他紧急事件',
      handleContent: '',
      happenTime: '2026-02-19 08:28:38',
      isEnd: '',
      isTunnel: '否',
      kmEnd: 'K68+0',
      kmStart: 'K68+0',
      lat: '25.38366',
      lon: '118.65913',
      orgName: '莆田分公司',
      route: 'S55',
      routeName: '秀永高速',
    },
  ],
  1771461523167286: [
    {
      content:
        '08:38 接涵江萩芦所上报：二轮车（1部）从3道（免征车道）非法闯入上高速 ，方向不明；08:38 已通知高速交警、高速执法。',
      direction: '其它',
      endTime: '',
      eventLve: '一般事件',
      eventNo: '1771461523167286',
      eventStatus: '执行中',
      eventType: '其他紧急事件',
      handleContent: '',
      happenTime: '2026-02-19 08:38:27',
      isEnd: '',
      isTunnel: '否',
      kmEnd: 'K39+0',
      kmStart: 'K39+0',
      lat: '25.49622',
      lon: '119.19229',
      orgName: '莆田分公司',
      route: 'G1517',
      routeName: '莆炎高速',
    },
  ],
  1771860503371260: [
    {
      content:
        '23:01 接华亭所上报：二轮车（1部）从3道（人工车道）非法闯入上高速 ，往莆田方向；23:28 已通知高速交警、路勤部门。',
      direction: 'B方向',
      endTime: '',
      eventLve: '一般事件',
      eventNo: '1771860503371260',
      eventStatus: '执行中',
      eventType: '其他紧急事件',
      handleContent: '',
      happenTime: '2026-02-23 23:28:14',
      isEnd: '',
      isTunnel: '否',
      kmEnd: 'K33+0',
      kmStart: 'K33+0',
      lat: '25.39928',
      lon: '118.97723',
      orgName: '莆田分公司',
      route: 'S55',
      routeName: '秀永高速',
    },
  ],
  1772596220615286: [
    {
      content:
        '11:50 接仙游城区所上报：二轮车（2部）从7#道（人工车道）非法闯入上高速 ，方向不明；11:50 已通知高速交警、高速执法部门。',
      direction: '其它',
      endTime: '',
      eventLve: '一般事件',
      eventNo: '1772596220615286',
      eventStatus: '执行中',
      eventType: '其他紧急事件',
      handleContent: '',
      happenTime: '2026-03-04 11:50:12',
      isEnd: '',
      isTunnel: '否',
      kmEnd: 'K59+0',
      kmStart: 'K59+0',
      lat: '25.3791',
      lon: '118.74196',
      orgName: '莆田分公司',
      route: 'S55',
      routeName: '秀永高速',
    },
  ],
  1772602106228658: [
    {
      content:
        '13:28 接莆田忠门所上报：二轮车（1部）从3#道（人工车道）非法闯入上高速 ，往莆田方向；13:29 已通知高速交警、高速执法部门。',
      direction: 'A方向',
      endTime: '',
      eventLve: '一般事件',
      eventNo: '1772602106228658',
      eventStatus: '执行中',
      eventType: '其他紧急事件',
      handleContent: '',
      happenTime: '2026-03-04 13:28:21',
      isEnd: '',
      isTunnel: '否',
      kmEnd: 'K6+0',
      kmStart: 'K6+0',
      lat: '25.21056',
      lon: '119.10164',
      orgName: '莆田分公司',
      route: 'S55',
      routeName: '秀永高速',
    },
  ],
  1772649482307259: [
    {
      content:
        '秀屿收费站上报，3#货车（未识别车牌）超限34.86%，4轴，车货总重：58T吨，运载多辆小车冲关上高速，02:39 已通知高速交警、高速执法。',
      direction: '其它',
      endTime: '',
      eventLve: '一般事件',
      eventNo: '1772649482307259',
      eventStatus: '执行中',
      eventType: '其他紧急事件',
      handleContent: '',
      happenTime: '2026-03-05 02:37:55',
      isEnd: '',
      isTunnel: '否',
      kmEnd: 'K13+0',
      kmStart: 'K13+0',
      lat: '25.26238',
      lon: '119.06535',
      orgName: '莆田分公司',
      route: 'S55',
      routeName: '秀永高速',
    },
  ],
  1772907900128292: [
    {
      content:
        '湄洲岛收费站上报，货车车牌（黄赣H52262、黄赣H85775）超长车，运载多辆小车冲关上高速，5轴，冲关上高速，02:25 已通知高速执法、高速交警。',
      direction: 'A方向',
      endTime: '',
      eventLve: '一般事件',
      eventNo: '1772907900128292',
      eventStatus: '执行中',
      eventType: '其他紧急事件',
      handleContent: '',
      happenTime: '2026-03-08 02:24:46',
      isEnd: '',
      isTunnel: '否',
      kmEnd: 'K1+0',
      kmStart: 'K1+0',
      lat: '25.16793',
      lon: '119.11545',
      orgName: '莆田分公司',
      route: 'S55',
      routeName: '秀永高速',
    },
  ],
  1773215465742265: [
    {
      content:
        '15:51 接涵江庄边所上报：二轮车（3部）从5道（人工车道）非法闯入上高速 ，往萩芦方向；15:52已通知高速交警、高速执法、省联网中心。',
      direction: 'B方向',
      endTime: '',
      eventLve: '一般事件',
      eventNo: '1773215465742265',
      eventStatus: '执行中',
      eventType: '其他紧急事件',
      handleContent: '',
      happenTime: '2026-03-11 15:51:02',
      isEnd: '',
      isTunnel: '否',
      kmEnd: 'K65+0',
      kmStart: 'K65+0',
      lat: '25.60929',
      lon: '118.9894',
      orgName: '莆田分公司',
      route: 'G1517',
      routeName: '莆炎高速',
    },
  ],
  1773215577367267: [
    {
      content:
        '15:52 接莆田西所上报：二轮车（1部）从3道（人工车道）非法闯入上高速 ，往秀屿方向；15:53 已通知高速交警、高速执法。',
      direction: 'B方向',
      endTime: '',
      eventLve: '一般事件',
      eventNo: '1773215577367267',
      eventStatus: '执行中',
      eventType: '其他紧急事件',
      handleContent: '',
      happenTime: '2026-03-11 15:52:48',
      isEnd: '',
      isTunnel: '否',
      kmEnd: 'K33+0',
      kmStart: 'K33+0',
      lat: '25.39928',
      lon: '118.97723',
      orgName: '莆田分公司',
      route: 'S55',
      routeName: '秀永高速',
    },
  ],
  1773225843079270: [
    {
      content:
        '18:43 接涵江庄边所上报：二轮车（2部）从5道（人工车道）非法闯入上高速 ，往萩芦方向；18:43 已通知高速交警、高速执法。',
      direction: 'B方向',
      endTime: '',
      eventLve: '一般事件',
      eventNo: '1773225843079270',
      eventStatus: '执行中',
      eventType: '其他紧急事件',
      handleContent: '',
      happenTime: '2026-03-11 18:43:52',
      isEnd: '',
      isTunnel: '否',
      kmEnd: 'K65+0',
      kmStart: 'K65+0',
      lat: '25.60929',
      lon: '118.9894',
      orgName: '莆田分公司',
      route: 'G1517',
      routeName: '莆炎高速',
    },
  ],
  1773240440109392: [
    {
      content:
        '22:46 接莆田西所上报：二轮车（1部）从5道（人工车道）非法闯入上高速 ，往莆田方向；22:47已通知高速交警、高速执法。',
      direction: 'B方向',
      endTime: '',
      eventLve: '一般事件',
      eventNo: '1773240440109392',
      eventStatus: '执行中',
      eventType: '其他紧急事件',
      handleContent: '',
      happenTime: '2026-03-11 22:46:47',
      isEnd: '',
      isTunnel: '否',
      kmEnd: 'K33+0',
      kmStart: 'K33+0',
      lat: '25.39928',
      lon: '118.97723',
      orgName: '莆田分公司',
      route: 'S55',
      routeName: '秀永高速',
    },
  ],
  1773347205884394: [
    {
      content:
        '秀屿收费站上报，入口7#拖运车（车牌：未识别车牌）超限22.38%，5轴，车货总重：51.4T吨，运载多辆小车冲关上高速，04:27 已通知高速交警、高速执法。',
      direction: '其它',
      endTime: '',
      eventLve: '一般事件',
      eventNo: '1773347205884394',
      eventStatus: '执行中',
      eventType: '其他紧急事件',
      handleContent: '',
      happenTime: '2026-03-13 04:26:39',
      isEnd: '',
      isTunnel: '否',
      kmEnd: 'K13+0',
      kmStart: 'K13+0',
      lat: '25.26238',
      lon: '119.06535',
      orgName: '莆田分公司',
      route: 'S55',
      routeName: '秀永高速',
    },
  ],
  1773547912303690: [
    {
      content:
        '12:11 接湄洲岛所上报：二轮车（1部）从9道（人工车道）非法闯入上高速 ，往莆田方向；12:12 已通知高速交警、高速执法。',
      direction: 'A方向',
      endTime: '',
      eventLve: '一般事件',
      eventNo: '1773547912303690',
      eventStatus: '执行中',
      eventType: '其他紧急事件',
      handleContent: '',
      happenTime: '2026-03-15 12:11:47',
      isEnd: '',
      isTunnel: '否',
      kmEnd: 'K1+0',
      kmStart: 'K1+0',
      lat: '25.16793',
      lon: '119.11545',
      orgName: '莆田分公司',
      route: 'S55',
      routeName: '秀永高速',
    },
  ],
  1773616166489787: [
    {
      content:
        '07:09，接养护部门通知，G1523线甬莞高速莆田段AK781+100-AK781+500处（距仙游榜头收费站约7公里），正在进行日常养护施工，占用慢车道和应急车道，目前道路可正常通行，预计17:00施工结束，相关情报板已发布提示信息。',
      direction: 'A方向',
      endTime: '',
      eventLve: '一般事件',
      eventNo: '1773616166489787',
      eventStatus: '执行中',
      eventType: '施工养护事件',
      handleContent: '',
      happenTime: '2026-03-16 07:09:53',
      isEnd: '',
      isTunnel: '是',
      kmEnd: 'K781+500',
      kmStart: 'K781+100',
      lat: '25.491648766020813',
      lon: '118.69552144667165',
      orgName: '莆田分公司',
      route: 'G1523',
      routeName: '甬莞高速',
    },
  ],
  1773616527762670: [
    {
      content:
        '07:15，接养护部门通知，S55线秀永高速莆田段BK15-BK10处（距秀屿收费站约2公里），正在进行除草剂喷洒施工，占用应急车道，目前道路可正常通行，预计17:30施工结束，相关情报板已发布提示信息。',
      direction: 'B方向',
      endTime: '',
      eventLve: '一般事件',
      eventNo: '1773616527762670',
      eventStatus: '执行中',
      eventType: '施工养护事件',
      handleContent: '',
      happenTime: '2026-03-16 07:15:54',
      isEnd: '',
      isTunnel: '否',
      kmEnd: 'K10+0',
      kmStart: 'K15+0',
      lat: '25.251907669316452',
      lon: '119.07428110535449',
      orgName: '莆田分公司',
      route: 'S55',
      routeName: '秀永高速',
    },
  ],
  1773617231664763: [
    {
      content:
        '07:27，接养护部门通知，S55线秀永高速莆田段BK2-BK1处（距湄洲岛收费站约1公里），正在进行边坡修复施工，占用应急车道，目前道路可正常通行，预计17:00施工结束。',
      direction: 'B方向',
      endTime: '',
      eventLve: '一般事件',
      eventNo: '1773617231664763',
      eventStatus: '已核实',
      eventType: '施工养护事件',
      handleContent: '',
      happenTime: '2026-03-16 07:27:38',
      isEnd: '',
      isTunnel: '否',
      kmEnd: 'K1+0',
      kmStart: 'K2+0',
      lat: '25.17239797912364',
      lon: '119.11496718322633',
      orgName: '莆田分公司',
      route: 'S55',
      routeName: '秀永高速',
    },
  ],
  1773619746859772: [
    {
      content:
        '08:09，接养护部门通知，G1517线莆炎高速莆田段AK16+800-AK17处（过荔城北高收费站约3公里），正在进行下边坡流水槽修复施工，占用应急车道，目前道路可正常通行，预计18:00施工结束，相关情报板已发布提示信息。',
      direction: 'A方向',
      endTime: '',
      eventLve: '一般事件',
      eventNo: '1773619746859772',
      eventStatus: '执行中',
      eventType: '施工养护事件',
      handleContent: '',
      happenTime: '2026-03-16 08:09:33',
      isEnd: '',
      isTunnel: '否',
      kmEnd: 'K17+800',
      kmStart: 'K16+800',
      lat: '25.3728923389238',
      lon: '119.12042471071592',
      orgName: '莆田分公司',
      route: 'G1517',
      routeName: '莆炎高速',
    },
  ],
  1773620365871255: [
    {
      content:
        '08:19，接养护部门通知，G1517线莆炎高速莆田段AK88+900-AK89+200处（距五星枢纽约4公里，含古寨隧道），正在进行清理隧道葫芦沟施工，占用超车道，目前道路可正常通行，预计17:00施工结束，相关情报板已发布提示信息。',
      direction: 'A方向',
      endTime: '',
      eventLve: '一般事件',
      eventNo: '1773620365871255',
      eventStatus: '执行中',
      eventType: '施工养护事件',
      handleContent: '',
      happenTime: '2026-03-16 08:19:52',
      isEnd: '',
      isTunnel: '是',
      kmEnd: 'K89+200',
      kmStart: 'K88+900',
      lat: '25.679469983017235',
      lon: '118.7821275745487',
      orgName: '莆田分公司',
      route: 'G1517',
      routeName: '莆炎高速',
    },
  ],
  1773621598474288: [
    {
      content:
        '08:39 接仙游龙华所上报：二轮车（1部）从1道（ETC车道）非法闯入上高速 ，往泉州方向；08:40已通知高速交警、高速执法。',
      direction: 'A方向',
      endTime: '',
      eventLve: '一般事件',
      eventNo: '1773621598474288',
      eventStatus: '执行中',
      eventType: '其他紧急事件',
      handleContent: '',
      happenTime: '2026-03-16 08:39:48',
      isEnd: '',
      isTunnel: '否',
      kmEnd: 'K801+0',
      kmStart: 'K801+0',
      lat: '25.34329',
      lon: '118.62758',
      orgName: '莆田分公司',
      route: 'G1523',
      routeName: '甬莞高速',
    },
  ],
  1773624670769781: [
    {
      content:
        '09:31，接养护部门通知，S55线秀永高速莆田段AK63-AK68处（过仙游城区收费站约4公里），正在进行边坡病虫防治施工，占用应急车道，目前道路可正常通行，预计17:00施工结束，相关情报板已发布提示信息。',
      direction: 'A方向',
      endTime: '',
      eventLve: '一般事件',
      eventNo: '1773624670769781',
      eventStatus: '执行中',
      eventType: '施工养护事件',
      handleContent: '',
      happenTime: '2026-03-16 09:31:37',
      isEnd: '',
      isTunnel: '否',
      kmEnd: 'K68+0',
      kmStart: 'K63+0',
      lat: '25.385123707060004',
      lon: '118.68378855182246',
      orgName: '莆田分公司',
      route: 'S55',
      routeName: '秀永高速',
    },
  ],
};

const TRAFFIC_EVENT_SEED_ENTRIES = Object.entries(TRAFFIC_EVENT_SEED_MAP);

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomFloat = (min, max, digit = 1) =>
  Number((Math.random() * (max - min) + min).toFixed(digit));

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const pad2 = (value) => String(value).padStart(2, '0');

const formatDateTime = (date) => {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hour = pad2(date.getHours());
  const minute = pad2(date.getMinutes());
  const second = pad2(date.getSeconds());
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

const randomPick = (arr) => arr[randomInt(0, arr.length - 1)];

const cloneMockPayload = (payload) => {
  if (payload == null) return payload;
  return JSON.parse(JSON.stringify(payload));
};

const createStableTwoSamePerFive = (builder) => {
  const windowSize = 5;
  let requestCount = 0;
  let repeatPositions = [1, 2];
  let cachedPayload = null;

  return () => {
    requestCount += 1;
    const positionInWindow = ((requestCount - 1) % windowSize) + 1;

    if (positionInWindow === 1) {
      const firstRepeat = randomInt(1, windowSize);
      let secondRepeat = firstRepeat;
      while (secondRepeat === firstRepeat) {
        secondRepeat = randomInt(1, windowSize);
      }
      repeatPositions = [firstRepeat, secondRepeat];
      cachedPayload = null;
    }

    if (repeatPositions.includes(positionInWindow)) {
      if (!cachedPayload) {
        cachedPayload = builder();
      }
      return cloneMockPayload(cachedPayload);
    }

    return builder();
  };
};

const createStableThreeSameOneEmptyPerFive = (builder, emptyBuilder) => {
  const windowSize = 5;
  let requestCount = 0;
  let repeatPositions = [1, 2, 4];
  let emptyPosition = 3;
  let cachedPayload = null;

  return () => {
    requestCount += 1;
    const positionInWindow = ((requestCount - 1) % windowSize) + 1;

    if (positionInWindow === 1) {
      const repeatStart = randomInt(1, 3);
      repeatPositions = [repeatStart, repeatStart + 1, repeatStart + 2];
      const emptyCandidates = [1, 2, 3, 4, 5].filter(
        (p) => !repeatPositions.includes(p)
      );
      emptyPosition = randomPick(emptyCandidates);
      cachedPayload = null;
    }

    if (positionInWindow === emptyPosition) {
      return cloneMockPayload(emptyBuilder());
    }

    if (repeatPositions.includes(positionInWindow)) {
      if (!cachedPayload) {
        cachedPayload = builder();
      }
      return cloneMockPayload(cachedPayload);
    }

    return builder();
  };
};

const createPairedMockBundle = (builder) => {
  let pairIndex = 0;
  let cachedPayload = null;

  return () => {
    if (pairIndex === 0 || !cachedPayload) {
      cachedPayload = builder();
    }
    pairIndex = (pairIndex + 1) % 2;
    return cloneMockPayload(cachedPayload);
  };
};

const shuffleArray = (arr) => {
  const copied = [...arr];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
};

const randomCode = (source, len) =>
  Array.from({ length: len }, () => source[randomInt(0, source.length - 1)])
    .join('')
    .toUpperCase();

const generatePlate = () =>
  `${randomPick(PROVINCES)}${randomCode(LETTERS, 1)}${randomCode(ALPHA_NUM, 5)}`;

const generatePassId = (sectionIndex, vehicleIndex, now) => {
  const stamp =
    String(now.getFullYear()) +
    pad2(now.getMonth() + 1) +
    pad2(now.getDate()) +
    pad2(now.getHours()) +
    pad2(now.getMinutes()) +
    pad2(now.getSeconds());
  return `MOCK${pad2(sectionIndex)}${String(vehicleIndex).padStart(3, '0')}${stamp}${randomInt(1000, 9999)}`;
};

const resolveStatusBySpeed = (speed) => {
  if (speed <= 20) return '拥堵';
  if (speed <= 55) return '缓行';
  return '畅通';
};

const calcStrandedCount = (flow, status) => {
  if (flow <= 0) return 0;
  if (status === '拥堵') {
    return clamp(Math.round(flow * randomFloat(0.6, 0.9)), 1, flow);
  }
  if (status === '缓行') {
    return clamp(Math.round(flow * randomFloat(0.25, 0.6)), 0, flow);
  }
  return clamp(Math.round(flow * randomFloat(0.05, 0.2)), 0, flow);
};

const randomStrandedMinutes = (status) => {
  if (status === '拥堵') return randomFloat(12, 120);
  if (status === '缓行') return randomFloat(6, 35);
  return randomFloat(3, 15);
};

const getStartOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);

const getEndOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

const randomDateBetween = (start, end) => {
  const startMs = start.getTime();
  const endMs = end.getTime();
  if (endMs <= startMs) return new Date(startMs);
  return new Date(randomInt(startMs, endMs));
};

const toNodeName = (sectionName, index) => {
  const parts = String(sectionName || '')
    .split('-')
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.length > index) return parts[index];
  if (parts.length > 0) return parts[0];
  return '未知区段';
};

const generatePathString = () => {
  const pointCount = randomInt(3, 6);
  const startLng = randomFloat(118.75, 119.25, 6);
  const startLat = randomFloat(25.15, 25.65, 6);
  const points = [];
  for (let i = 0; i < pointCount; i += 1) {
    const lng = Number((startLng + i * randomFloat(0.003, 0.01, 6)).toFixed(6));
    const lat = Number(
      (startLat + i * randomFloat(-0.006, 0.008, 6)).toFixed(6)
    );
    points.push(`${lng},${lat}`);
  }
  return points.join(';');
};

const buildVehJamStatusMock = () => {
  const now = new Date();
  const dayStart = getStartOfDay(now);
  const dayEnd = getEndOfDay(now);

  const congestionEventList = [];
  const roadConditionList = [];
  const sectionMgmtList = [];
  const vehicleList = [];

  const shuffledSections = shuffleArray(VEH_JAM_SECTIONS);
  // 每次请求累计新增1条：第1次+1、第2次+2...
  vehJamExtraCount += 1;
  for (let extraIndex = 0; extraIndex < vehJamExtraCount; extraIndex += 1) {
    const seedSection = randomPick(VEH_JAM_SECTIONS);
    const dynamicSection = {
      ...seedSection,
      Flagid: `DYN-${vehJamExtraCount}-${extraIndex}-${randomCode(ALPHA_NUM, 4)}-${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`,
      sectionName: `${seedSection.sectionName}-新增区段${vehJamExtraCount}-${extraIndex + 1}`,
      stakeNum: `${seedSection.stakeNum}-DYN${vehJamExtraCount}-${extraIndex + 1}`,
      baseFlow: clamp(seedSection.baseFlow + randomInt(-3, 8), 1, 150),
      baseSpeed: clamp(
        randomFloat(seedSection.baseSpeed - 8, seedSection.baseSpeed + 8),
        1,
        100
      ),
    };
    shuffledSections.push(dynamicSection);
  }

  shuffledSections.forEach((section, sectionIndex) => {
    const fixedCongestionEvent =
      section.Flagid === SLOW_CONGESTION_EVENT_SAMPLE.Flagid
        ? SLOW_CONGESTION_EVENT_SAMPLE
        : null;
    const sectionTimeDate = fixedCongestionEvent
      ? new Date(fixedCongestionEvent.time.replace(' ', 'T'))
      : randomDateBetween(dayStart, now);
    const sectionTime = fixedCongestionEvent
      ? fixedCongestionEvent.time
      : formatDateTime(sectionTimeDate);

    const flow = fixedCongestionEvent
      ? fixedCongestionEvent.totalVehicles
      : clamp(section.baseFlow + randomInt(-6, 8), 0, 120);
    const avgSpeed = fixedCongestionEvent
      ? fixedCongestionEvent.avgSpeed
      : clamp(
          randomFloat(section.baseSpeed - 12, section.baseSpeed + 12),
          0.8,
          90
        );
    const congestionStatus = fixedCongestionEvent
      ? fixedCongestionEvent.congestionStatus
      : resolveStatusBySpeed(avgSpeed);
    const strandedVehicles = fixedCongestionEvent
      ? fixedCongestionEvent.strandedVehicles
      : calcStrandedCount(flow, congestionStatus);
    const strandedTrucks = fixedCongestionEvent
      ? fixedCongestionEvent.strandedTrucks
      : clamp(
          Math.round(strandedVehicles * randomFloat(0.05, 0.35)),
          0,
          strandedVehicles
        );
    const strandedGuests = fixedCongestionEvent
      ? fixedCongestionEvent.strandedGuests
      : strandedVehicles - strandedTrucks;

    const passids = [];
    for (let i = 0; i < strandedVehicles; i += 1) {
      const passid = generatePassId(sectionIndex, i, now);
      passids.push(passid);

      const strandedMinutes = randomStrandedMinutes(congestionStatus);
      const entryTimeRaw = new Date(
        sectionTimeDate.getTime() - strandedMinutes * 60 * 1000
      );
      const predExitTimeRaw = new Date(
        sectionTimeDate.getTime() + randomInt(1, 8) * 60 * 1000
      );
      const entryTime = entryTimeRaw < dayStart ? dayStart : entryTimeRaw;
      const predExitTime = predExitTimeRaw > dayEnd ? dayEnd : predExitTimeRaw;
      const isTruck = i < strandedTrucks;
      const currentSpeed = clamp(
        randomFloat(avgSpeed - 8, avgSpeed + (isTruck ? 2 : 6)),
        0.5,
        95
      );

      vehicleList.push({
        currentSpeed,
        entryTime: formatDateTime(entryTime),
        isStranded: true,
        linkId: section.Flagid,
        passid,
        plate: generatePlate(),
        predExitTime: formatDateTime(predExitTime),
        strandedTime: `${strandedMinutes.toFixed(1)}分钟`,
        vehType: isTruck ? '货车' : '客车',
      });
    }

    congestionEventList.push({
      Flagid: fixedCongestionEvent
        ? fixedCongestionEvent.Flagid
        : section.Flagid,
      avgSpeed,
      congestionStatus,
      downstreamVehicles: fixedCongestionEvent
        ? fixedCongestionEvent.downstreamVehicles
        : flow,
      sectionName: fixedCongestionEvent
        ? fixedCongestionEvent.sectionName
        : section.sectionName,
      stakeNum: fixedCongestionEvent
        ? fixedCongestionEvent.stakeNum
        : section.stakeNum,
      strandedGuests,
      strandedTrucks,
      strandedVehicles,
      time: sectionTime,
      totalVehicles: flow,
      type: fixedCongestionEvent ? fixedCongestionEvent.type : congestionStatus,
      upstreamVehicles: fixedCongestionEvent
        ? fixedCongestionEvent.upstreamVehicles
        : flow,
    });

    roadConditionList.push({
      Flagid: section.Flagid,
      avgSpeed,
      flow,
      sectionName: section.sectionName,
      stakeNum: section.stakeNum,
      time: sectionTime,
    });

    sectionMgmtList.push({
      downstreamCount: strandedVehicles,
      passids: passids.join(','),
      sectionName: section.sectionName,
      time: sectionTime,
      upstreamCount: strandedVehicles,
      vehicleCount: strandedVehicles,
    });
  });

  return {
    congestionEventList,
    roadConditionList,
    sectionMgmtList,
    vehicleList,
  };
};

const buildJamRoadsMock = () => {
  const now = new Date();
  const dayStart = getStartOfDay(now);
  const dayEnd = getEndOfDay(now);

  const shuffledSections = shuffleArray(VEH_JAM_SECTIONS);
  jamRoadExtraCount += 1;

  const baseCount = randomInt(6, 12);
  const totalCount = Math.min(
    shuffledSections.length,
    baseCount + jamRoadExtraCount
  );
  const selectedSections = shuffledSections.slice(0, totalCount);

  return selectedSections.map((section, index) => {
    const startTimeDate = randomDateBetween(dayStart, now);
    const endTimeUpper =
      now.getTime() > startTimeDate.getTime()
        ? now
        : new Date(startTimeDate.getTime() + 5 * 60 * 1000);
    const endTimeDate = randomDateBetween(startTimeDate, endTimeUpper);

    const fromName = toNodeName(section.sectionName, 0);
    const toname = toNodeName(section.sectionName, 1);
    const avgSpeed = clamp(
      randomFloat(section.baseSpeed - 15, section.baseSpeed + 8),
      2,
      60
    );
    const flow = clamp(section.baseFlow + randomInt(-6, 20), 1, 180);
    const status = randomPick(['持续拥堵', '拥堵缓解中', '新增拥堵']);
    const path = generatePathString();

    return {
      id: `JAM-${jamRoadExtraCount}-${index + 1}-${randomCode(ALPHA_NUM, 5)}`,
      startTime: formatDateTime(startTimeDate),
      endTime: formatDateTime(endTimeDate > dayEnd ? dayEnd : endTimeDate),
      ennode: fromName,
      exnode: toname,
      fromName,
      toname,
      status,
      type: '拥堵',
      avgSpeed,
      flow,
      stakeNum: section.stakeNum,
      Path: path,
    };
  });
};

const buildJamRoadsEmpty = () => [];
const buildVehJamStatusEmpty = () => [];
const buildTrafficEventInfoEmpty = () => ({
  data: {},
});
const buildSectionMgmtListEmpty = () => [];
const buildVehicleListEmpty = () => [];
const buildTeQingSectionEmpty = () => [];
const buildTeQingListEmpty = () => [];

const getVehJamStatusMock = createStableTwoSamePerFive(buildVehJamStatusMock);
const getSectionVehicleBundleMock = createPairedMockBundle(
  buildVehJamStatusMock
);
const getJamRoadsMock = createStableThreeSameOneEmptyPerFive(
  buildJamRoadsMock,
  buildJamRoadsEmpty
);

const buildTeQingSectionMock = () => {
  const now = new Date();
  return shuffleArray(VEH_JAM_SECTIONS)
    .slice(0, 4)
    .map((section, index) => {
      const total = clamp(section.baseFlow + randomInt(8, 30), 6, 80);
      const car = clamp(Math.round(total * randomFloat(0.55, 0.8)), 1, total);
      const trunk = total - car;
      return {
        flagId: `EX-${index + 1}-${section.Flagid}`,
        flagName: section.sectionName,
        total,
        car,
        trunk,
        timePeriod: formatDateTime(
          new Date(now.getTime() - randomInt(1, 30) * 60 * 1000)
        ),
      };
    });
};

const buildTeQingListMock = () => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => ({
    passid: `EXPASS${pad2(index + 1)}${now.getTime()}`,
    flagname: randomPick(VEH_JAM_SECTIONS).sectionName,
    errorDesc: randomPick([
      '疑似车型不符',
      '路径异常',
      '入口信息缺失',
      '交易门架识别异常',
    ]),
    plate: generatePlate(),
    flagid: `EX-FLAG-${pad2(index + 1)}`,
    tradeTime: formatDateTime(
      new Date(now.getTime() - randomInt(1, 120) * 60 * 1000)
    ),
  }));
};

const buildTrafficEventInfoMock = () => {
  const maxCount = TRAFFIC_EVENT_SEED_ENTRIES.length;
  if (maxCount <= 0) {
    return { data: {} };
  }

  trafficEventIncrementCount = clamp(
    trafficEventIncrementCount + 1,
    1,
    maxCount
  );

  const selectedEntries = TRAFFIC_EVENT_SEED_ENTRIES.slice(
    0,
    trafficEventIncrementCount
  );

  const data = selectedEntries.reduce((acc, [eventNo, eventList]) => {
    acc[eventNo] = (Array.isArray(eventList) ? eventList : []).map((item) => ({
      ...item,
    }));
    return acc;
  }, {});

  return {
    data,
  };
};

// Mock数据配置
const mockDataConfig = {
  // getVideoList接口mock数据
  getVideoList: {
    data: {
      code: 20000,
      data: [
        {
          cameraName: 'G15 沈海高速-厦门马銮湾收费站-D匝道 DK0+295',
          cameraNum: '644ef9de-03e7-4b28-a881-9a8d132ec55c',
          controllable: 0,
          deviceTypeForMap: 1,
          latitude: null,
          locationTypeForMap: 0,
          longitude: null,
          onLine: 0,
          pileNum: '295',
          roadCode: 'G15',
          roadDirection: null,
        },
        {
          cameraName: 'G15 沈海高速-厦门马銮湾收费站-E匝道 DK0+300',
          cameraNum: '755fg0ef-14f8-5c39-b992-ab9e243fd66d',
          controllable: 1,
          deviceTypeForMap: 1,
          latitude: 24.512345,
          locationTypeForMap: 0,
          longitude: 118.123456,
          onLine: 1,
          pileNum: '300',
          roadCode: 'G15',
          roadDirection: 1,
        },
        {
          cameraName: 'S63 古平高速-平和安厚至东寨枢纽-ETC门架车流 AK34+770',
          cameraNum: 'd697ad24-6640-4341-bbc8-e62c90932753',
          controllable: 0,
          deviceTypeForMap: 1,
          latitude: 24.123726,
          locationTypeForMap: 4,
          longitude: 117.216608,
          onLine: 1,
          pileNum: '34770',
          roadCode: 'S63',
          roadDirection: 1,
        },
      ],
      message: '查询数据成功！',
    },
  },
  // getVideoUrl接口mock数据
  getVideoUrl: {
    data: {
      data: {
        audioCodecType: null,
        bitrate: null,
        chnId: '1846029707609116672',
        codecType: null,
        devId: '1823281491944411136',
        packType: null,
        sampleRate: null,
        url: 'ws://35.41.30.245:559/openUrl/WjD91jr',
      },
      message: 'success',
      path: null,
      status: 200,
      timestamp: '2026-02-09 18:20:28',
    },
  },
  // 堵塞信息等（复核接口）：恢复 mock 假数据，空数据逻辑注释保留
  getVehJamStatus: () => getVehJamStatusMock(),
  // getVehJamStatus: () => buildVehJamStatusEmpty(),
  // 获取拥堵路段信息：恢复 mock 假数据，空数据逻辑注释保留
  getJamRoads: () => getJamRoadsMock(),
  // getJamRoads: () => buildJamRoadsEmpty(),
  // 实时路况（缓行区段）接口：匹配 getCongestionEventList URL
  getCongestionEventList: () => getVehJamStatusMock().congestionEventList,
  '/api/function/congestionEventList': () =>
    getVehJamStatusMock().congestionEventList,
  // 交通事件接口：恢复 mock 假数据，空数据逻辑注释保留
  getTrafficFromChangwei: () => buildTrafficEventInfoMock(),
  // getTrafficFromChangwei: () => buildTrafficEventInfoEmpty(),
  // 区段重点车辆相关接口：返回联动的 mock 假数据
  getSectionMgmtList: () => getSectionVehicleBundleMock().sectionMgmtList,
  getVehicleList: () => getSectionVehicleBundleMock().vehicleList,
  getTeQingSection: () => buildTeQingSectionMock(),
  getTeQingList: () => buildTeQingListMock(),
  // 可以在此处添加更多接口的mock数据
  getEventData: {
    code: 20000,
    data: [],
    message: '查询数据成功！',
  },
  getAvgSpeed: {
    code: 20000,
    data: {},
    message: '查询数据成功！',
  },
};

// Mock服务类
class MockService {
  constructor() {
    this.mockData = mockDataConfig;
    this.isEnabled = false; // 控制mock是否启用（默认开启）
  }

  // 设置mock开关
  setEnabled(enabled) {
    this.isEnabled = enabled === true;
  }

  // 获取mock开关状态
  getEnabled() {
    return this.isEnabled;
  }

  // 初始化时输出并返回mock状态
  logInitStatus() {
    if (this.isEnabled) {
      console.log('当前mock启用状态：', this.isEnabled);
    }
    return this.isEnabled;
  }

  // 获取mock数据
  getMockData(url) {
    if (this.isEnabled !== true || !url) return null;

    // 根据URL匹配对应的mock数据
    for (const [key, data] of Object.entries(this.mockData)) {
      if (url.includes(key)) {
        // 支持函数型mock，每次请求动态生成新数据
        const resolved = typeof data === 'function' ? data() : data;
        const logMockResponse = (payload) => {
          console.log('[MockService] mock response', {
            key,
            url,
            data: payload,
          });
        };
        if (
          resolved &&
          typeof resolved === 'object' &&
          typeof resolved.data === 'function'
        ) {
          const payload = {
            ...resolved,
            data: resolved.data(),
          };
          logMockResponse(payload);
          return payload;
        }
        logMockResponse(resolved);
        return resolved;
      }
    }

    return null;
  }

  // 添加新的mock数据
  addMockData(key, data) {
    this.mockData[key] = data;
  }

  // 移除mock数据
  removeMockData(key) {
    delete this.mockData[key];
  }

  // 更新mock数据
  updateMockData(key, data) {
    if (this.mockData[key]) {
      this.mockData[key] = { ...this.mockData[key], ...data };
    }
  }
}

// 导出单例
const mockService = new MockService();
export default mockService;
