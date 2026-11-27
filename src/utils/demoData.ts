import type { UserDataset } from '../types/douban';
import { parseCsvText } from './parser';

const DEMO_MAIN_CSV = `分类,状态,标题,评分,标记日期,标签,短评,链接
电影,看过,2001太空漫游 / 2001: A Space Odyssey,5星,2026-11-24,,服化道与视听哲学让人惊叹，太空歌剧的终极天花板。,https://movie.douban.com/subject/1292226/
电影,看过,十二怒汉 / 12 Angry Men,5星,2026-10-18,,一间密室、十二个人、零废话的逻辑推演，程序正义教科书。,https://movie.douban.com/subject/1293182/
电影,看过,社交网络 / The Social Network,5星,2026-09-12,,大卫芬奇的剪辑和索金的台词像手术刀一样精准。,https://movie.douban.com/subject/3205624/
电影,看过,漫长的季节,5星,2026-08-05,,东北工业黄昏的挽歌，笑中带刀，国产剧天花板之一。,https://movie.douban.com/subject/35437938/
电影,看过,寄生虫 / 기생충,2星,2026-07-19,,假装深刻，穷人不像穷人，富人不像富人，符号堆砌感太重。,https://movie.douban.com/subject/27010768/
电影,看过,赛博朋克：边缘行者 第一季,3星,2026-06-22,,新瓶装旧酒，强设定弱情节，美术确实骚但看到后面审美疲劳。,https://movie.douban.com/subject/35118256/
电影,看过,绝命毒师 第四季 / Breaking Bad Season 4,5星,2026-05-11,,人物动机严丝合缝，炸鸡叔和老白的博弈每一帧都是张力。,https://movie.douban.com/subject/4927382/
电影,看过,头号玩家 / Ready Player One,3星,2026-04-02,,彩蛋游乐园，爽完就忘，剧情本身单薄得像纸。,https://movie.douban.com/subject/4920389/
电影,看过,现代启示录 / Apocalypse Now,5星,2025-11-30,,沿着湄公河一路驶向人类文明的失控腹地，瓦格纳响起那一刻鸡皮疙瘩起来了。,https://movie.douban.com/subject/1292260/
电影,看过,牯岭街少年杀人事件,5星,2025-09-14,,四小时的冷峻时代解剖，没有人真正做错什么，又好像整个时代都在推波助澜。,https://movie.douban.com/subject/1292329/
电影,看过,四叠半神话大系,5星,2025-07-08,,汤浅政明的语速和脑洞太痛快了，青春执念的绝妙寓言。,https://movie.douban.com/subject/4221462/
电影,看过,葬送的芙莉莲,5星,2025-05-20,,反龙傲天的温柔史诗，时间流逝的余韵拉满。,https://movie.douban.com/subject/35633650/
电影,看过,沙丘2 / Dune: Part Two,4星,2025-03-15,,工业美学拉满，IMAX 声场压迫感极强，文戏略平。,https://movie.douban.com/subject/35634340/
电影,看过,奥本海默 / Oppenheimer,4星,2024-11-04,,诺兰把听证会拍出了谍战片的剪辑节奏。,https://movie.douban.com/subject/35593344/
电影,看过,穆赫兰道 / Mulholland Dr.,5星,2024-08-19,,梦境与愧疚的莫比乌斯环，后劲极大。,https://movie.douban.com/subject/1292217/
电影,看过,赛车总动员2 / Cars 2,2星,2024-05-03,,好好的赛车片拍成低幼特工闹剧，白瞎题材。,https://movie.douban.com/subject/3073124/
电影,看过,机动部队 / PTU,5星,2024-02-12,,杜琪峰夜晚的香港霓虹与宿命感，配乐绝了。,https://movie.douban.com/subject/1307847/
电影,看过,爱在日落黄昏时 / Before Sunset,4星,2023-11-02,,九年后的巴黎黄昏，话痨片能拍得如此克制动人。,https://movie.douban.com/subject/1291990/
电影,看过,搏击俱乐部 / Fight Club,5星,2023-07-21,,反消费主义狂想，二十多年后看依然辛辣。,https://movie.douban.com/subject/1292000/
电影,看过,小时代,1星,2023-04-09,,悬浮到让人脚趾抠出三室一厅，连当乐子看都嫌累。,https://movie.douban.com/subject/10757577/
电影,想看,窃听风暴 / Das Leben der Anderen,未评分,2023-06-15,,,https://movie.douban.com/subject/1900841/
电影,想看,风骚律师 第一季 / Better Call Saul,未评分,2024-01-20,,,https://movie.douban.com/subject/25723907/
电影,想看,银翼杀手2049 / Blade Runner 2049,未评分,2023-09-10,,,https://movie.douban.com/subject/10512661/
电影,想看,是，大臣 第一季 / Yes Minister,未评分,2024-05-18,,,https://movie.douban.com/subject/4929132/
电影,想看,极速车王 / Ford v Ferrari,未评分,2025-02-14,,,https://movie.douban.com/subject/6538866/
电影,想看,切尔诺贝利 / Chernobyl,未评分,2023-11-28,,,https://movie.douban.com/subject/27098632/
电影,在看,第五共和国 / 제5공화국,未评分,2024-12-06,,,https://movie.douban.com/subject/3240806/
读书,读过,置身事内：中国政府与经济发展,5星,2026-10-05,,清晰拆解财政事权与地方激励机制，社科入门神作。,https://book.douban.com/subject/35546622/
读书,读过,以利为利：财政关系与地方政府行为,5星,2026-08-29,,把基层运转逻辑讲透了，毫无悬浮说教。,https://book.douban.com/subject/10557941/
读书,读过,万历十五年,5星,2026-06-14,,大历史观的典范，个体在庞大文官制度里的无力感写得入木三分。,https://book.douban.com/subject/1041482/
读书,读过,燃烧的大洋：1941-1942太平洋战争,5星,2026-03-22,,战争是政治的延续，而打赢战争靠的是工业产能与后勤补给。,https://book.douban.com/subject/35059667/
读书,读过,乌合之众,1星,2026-01-19,,其实难副，充斥着十九世纪沙龙式的傲慢断言，缺乏实证支撑。,https://book.douban.com/subject/1012611/
读书,读过,埃隆·马斯克传,2星,2025-10-11,,后半本无聊至极，像是一个精力过剩的混球试图为自己洗白。,https://book.douban.com/subject/36508090/
读书,读过,二手时间,5星,2025-08-03,,冷峻克制的口述史，普通人在时代剧变里的窒息感直击人心。,https://book.douban.com/subject/26704547/
读书,读过,罪与罚,5星,2025-04-17,,生活代替了理论，陀思妥耶夫斯基把人的幽微心理剖开给人看。,https://book.douban.com/subject/26658672/
读书,读过,小径分岔的花园,5星,2024-10-25,,博尔赫斯用一万字搭出了一座无穷回环的哲学迷宫。,https://book.douban.com/subject/26365481/
读书,读过,百年孤独,5星,2024-06-30,,家族宿命与魔幻现实的巅峰，读完像过完了一百年。,https://book.douban.com/subject/6082808/
读书,读过,枪炮、病菌与钢铁,5星,2023-12-09,,用地理、生态与农业驯化解释文明分叉，视野极开阔。,https://book.douban.com/subject/1813841/
读书,读过,乡土中国,5星,2023-08-22,,差序格局四个字就能解释中国基层社会一半的现象。,https://book.douban.com/subject/1795079/
读书,读过,三体,4星,2023-05-14,,点子王炸、宇宙尺度震撼，但人物塑造确实偏工具人。,https://book.douban.com/subject/2567698/
读书,在读,显微镜下的大明,未评分,2025-11-12,,,https://book.douban.com/subject/30414743/
读书,在读,小镇喧嚣：一个乡镇政治运作的演绎与阐释,未评分,2026-02-18,,,https://book.douban.com/subject/2271415/
读书,想读,国家的视角：那些试图改善人类状况的项目是如何失败的,未评分,2023-08-11,,,https://book.douban.com/subject/1231687/
读书,想读,战后欧洲史,未评分,2024-03-04,,,https://book.douban.com/subject/25884402/
读书,想读,遥远的桥,未评分,2024-09-19,,,https://book.douban.com/subject/30286382/
读书,想读,退出、呼吁与忠诚,未评分,2025-04-08,,,https://book.douban.com/subject/1021810/
游戏,玩过,领主 / Suzerain,5星,2026-09-02,,硬核政治制度模拟器，每个预算和法案都在各方势力间走钢丝，爽翻！,https://www.douban.com/game/35196662/
游戏,玩过,边缘世界 / RimWorld,5星,2026-05-27,,最强的故事生成器，物流调度与危机管理的终极时间黑洞。,https://www.douban.com/game/26707035/
游戏,玩过,神力科莎 / Assetto Corsa,5星,2025-12-14,,方向盘力反馈和轮胎物理封神，纯正机械浪漫。,https://www.douban.com/game/26369964/
游戏,玩过,茶杯头 / Cuphead,2星,2025-07-04,,难是真的难，但背板刷到后面无聊也是真的无聊。,https://www.douban.com/game/26430836/
游戏,玩过,极限竞速：地平线4 / Forza Horizon 4,2星,2024-09-21,,派对嘉年华味太重，物理过于街机化，开一会儿就腻。,https://www.douban.com/game/30249642/
游戏,玩过,半条命2 / Half-Life 2,5星,2024-04-11,,超越时代二十年的关卡设计和物理引擎交互。,https://www.douban.com/game/10733900/
游戏,玩过,战争游戏：红龙 / Wargame: Red Dragon,5星,2023-10-16,,侦察、兵牌、补给线，硬核冷战战术天花板。,https://www.douban.com/game/26281911/
游戏,想玩,星际拓荒 / Outer Wilds,未评分,2023-12-20,,,https://www.douban.com/game/30479923/
游戏,想玩,传送门2 / Portal 2,未评分,2024-06-05,,,https://www.douban.com/game/10734014/
游戏,想玩,请出示证件 / Papers, Please,未评分,2025-01-12,,,https://www.douban.com/game/24844149/
音乐,听过,万能青年旅店,5星,2026-11-01,,小号响起那一秒，石家庄的尘土与时代情绪全涌上来了。,https://music.douban.com/subject/5365226/
音乐,听过,冀西南林路行,5星,2026-07-14,,编曲密度和空间感比首专更上一层楼，录音质感绝佳。,https://music.douban.com/subject/35291504/
音乐,听过,OK Computer,5星,2026-02-28,,九十年代末最精准的科技异化预言，吉他的冷冽感至今无人超越。,https://music.douban.com/subject/1406522/
音乐,听过,Debussy plays Debussy,5星,2025-09-30,,就是喜欢德彪西啊，音色留白像水面的光影。,https://music.douban.com/subject/1964521/
音乐,听过,他在时间门外,5星,2025-06-08,,窦唯最极致的东方氛围器乐实验，完全不腻。,https://music.douban.com/subject/3015984/
音乐,听过,我肯定在几百年前就说过爱你,2星,2025-01-25,,混响拉到最大，人声和乐器糊成一团，短视频甜腻套路。,https://music.douban.com/subject/34436525/
音乐,听过,APT.,1星,2024-11-18,,洗脑工业糖精，听两遍脑仁疼。,https://music.douban.com/subject/37080111/
音乐,听过,Abbey Road,5星,2024-03-22,,B面串烧是流行音乐史上最完美的乐章结构。,https://music.douban.com/subject/1400438/
音乐,听过,Soul Power Live,5星,2023-09-11,,华语现场编曲与律动天花板，乐手全员在线。,https://music.douban.com/subject/1403425/`;

const DEMO_FRIEND_CSV = `分类,状态,标题,评分,标记日期,标签,短评,链接
电影,看过,2001太空漫游 / 2001: A Space Odyssey,2星,2026-10-12,,太催眠了！前面猩猩跳了二十分钟我差点睡过去，欣赏不来这种玄学。,https://movie.douban.com/subject/1292226/
电影,看过,寄生虫 / 기생충,5星,2026-09-05,,奉俊昊的阶级隐喻和视听节奏太神了，商业与艺术的完美平衡！,https://movie.douban.com/subject/27010768/
电影,看过,十二怒汉 / 12 Angry Men,5星,2026-07-22,,全程无尿点，老电影的剧本功力真是降维打击。,https://movie.douban.com/subject/1293182/
电影,看过,漫长的季节,5星,2026-06-18,,王响回头那一幕直接泪崩，近年最好看的国产剧没有之一。,https://movie.douban.com/subject/35437938/
电影,看过,赛博朋克：边缘行者 第一季,5星,2026-05-03,,月球那首歌一响直接破防，扳机社的美学和情绪张力绝了！,https://movie.douban.com/subject/35118256/
电影,看过,绝命毒师 第四季 / Breaking Bad Season 4,5星,2026-03-19,,神剧！老白彻底黑化的高光一季。,https://movie.douban.com/subject/4927382/
电影,看过,头号玩家 / Ready Player One,5星,2025-11-08,,斯皮尔伯格给影迷和游戏迷的情书，电影院看爽爆了！,https://movie.douban.com/subject/4920389/
电影,看过,葬送的芙莉莲,5星,2025-08-24,,每一集都像在秋日午后喝热茶，温柔到骨子里。,https://movie.douban.com/subject/35633650/
电影,看过,爱在日落黄昏时 / Before Sunset,5星,2025-04-11,,"影史最浪漫的八十分钟散步，结尾那句「Baby, you are gonna miss that plane」封神。",https://movie.douban.com/subject/1291990/
电影,看过,花样年华,5星,2025-02-14,,王家卫把克制和暧昧拍成了艺术品，旗袍和配乐绝美。,https://movie.douban.com/subject/1291557/
电影,看过,布达佩斯大饭店 / The Grand Budapest Hotel,5星,2024-10-09,,韦斯安德森对称美学巅峰，像一本精致的童话画册。,https://movie.douban.com/subject/11525673/
电影,看过,窃听风暴 / Das Leben der Anderen,5星,2024-06-30,,献给好人的奏鸣曲，看完久久缓不过来，强烈安利！,https://movie.douban.com/subject/1900841/
电影,想看,银翼杀手2049 / Blade Runner 2049,未评分,2025-07-01,,,https://movie.douban.com/subject/10512661/
电影,想看,切尔诺贝利 / Chernobyl,未评分,2025-09-12,,,https://movie.douban.com/subject/27098632/
电影,想看,极速车王 / Ford v Ferrari,未评分,2026-01-15,,,https://movie.douban.com/subject/6538866/
读书,读过,置身事内：中国政府与经济发展,5星,2026-08-10,,写得太通俗透彻了，难得不装腔作势的经济学书。,https://book.douban.com/subject/35546622/
读书,读过,百年孤独,5星,2026-04-21,,语言像洪水一样席卷而来，记不住名字但完全沉浸其中。,https://book.douban.com/subject/6082808/
读书,读过,乌合之众,4星,2025-12-03,,看懂社交媒体群体情绪的好入口，挺有启发性的。,https://book.douban.com/subject/1012611/
读书,读过,二手时间,5星,2025-07-16,,沉重但必须读的书，每一个普通人的声音都让人心碎。,https://book.douban.com/subject/26704547/
读书,读过,三体,5星,2025-03-02,,黑暗森林法则太绝了，科幻脑洞天花板。,https://book.douban.com/subject/2567698/
读书,读过,悉达多,5星,2024-11-28,,薄薄一本却让人平静下来，每次迷茫都想重读。,https://book.douban.com/subject/26980487/
读书,想读,国家的视角：那些试图改善人类状况的项目是如何失败的,未评分,2025-05-09,,,https://book.douban.com/subject/1231687/
游戏,玩过,茶杯头 / Cuphead,5星,2026-06-11,,手绘橡胶管画风和爵士配乐无敌，双人合作通关成就感爆棚！,https://www.douban.com/game/26430836/
游戏,玩过,极限竞速：地平线4 / Forza Horizon 4,5星,2026-02-04,,下班开着超跑在英国乡间兜风放空太解压了！,https://www.douban.com/game/30249642/
游戏,玩过,边缘世界 / RimWorld,4星,2025-09-18,,好玩到忘记睡觉，就是小人天天崩溃有点血压高。,https://www.douban.com/game/26707035/
游戏,玩过,极乐迪斯科 / Disco Elysium,5星,2025-04-29,,电子游戏的文学性巅峰，内陆帝国和瑞瓦肖的雨太迷人了。,https://www.douban.com/game/34857322/
游戏,想玩,星际拓荒 / Outer Wilds,未评分,2025-08-03,,,https://www.douban.com/game/30479923/
游戏,想玩,请出示证件 / Papers, Please,未评分,2026-01-22,,,https://www.douban.com/game/24844149/
音乐,听过,万能青年旅店,5星,2026-09-15,,华语摇滚的丰碑，每次听《杀死那个石家庄人》都会起鸡皮疙瘩。,https://music.douban.com/subject/5365226/
音乐,听过,我肯定在几百年前就说过爱你,5星,2026-05-20,,告五人现场氛围感超棒啊，副歌旋律太上头了！,https://music.douban.com/subject/34436525/
音乐,听过,OK Computer,5星,2025-10-07,,雨夜耳机必备神专，Paranoid Android 百听不厌。,https://music.douban.com/subject/1406522/
音乐,听过,In Rainbows,5星,2025-06-19,,比 OK Computer 更温暖灵动，Weird Fishes 封神！,https://music.douban.com/subject/2275031/
音乐,听过,Soul Power Live,5星,2024-12-01,,陶喆巅峰现场，R&B 教科书。,https://music.douban.com/subject/1403425/`;

export function getDemoMainDataset(): UserDataset {
  return parseCsvText(DEMO_MAIN_CSV, '示例数据_林屿.csv', '林屿 (示例)');
}

export function getDemoFriendDataset(): UserDataset {
  return parseCsvText(DEMO_FRIEND_CSV, '示例好友_苏木.csv', '苏木 (示例好友)');
}
