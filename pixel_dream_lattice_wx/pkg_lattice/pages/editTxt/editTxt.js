const my = getApp().myCompat;
const comm = require('../../../utils/comm');
const { iconData,complement16 } = require('../../../imgData/imgdata');
const light = require('../../../utils/light');
let app = getApp();
Page({
  data: {
    arrNum: 0, //字莫总共数量
    h: 0, //色度值
    leftOffset: 0, //色块滑动偏移量
    arrStr: [] ,//输入字符数组
    char: [] ,//输入的字符,
    newChar:[] , //输入的字符跟图标,
    newIndex:[], //输入的字符跟图标索引(供删除使用),
    newIndexArr:[],// 过滤已经删除的子项
    colorArr:[], //输入的字符跟图标颜色,
    newColorArr:[] ,//过滤删除的字符跟图标颜色,
    onInpTxt:'' , //输入框的值
    charBack:{}, //app转换后的字符数组
    offset:0, //图标滑动偏移量
    // inpFocus: false, //输入框获取焦点标志
    txtIndex: 100, //选中文字下标
    insertAt: 0,
    inputFocused: false,
    previewScrollTarget: '',
    previewScrollLeft: 0,
    histroy: false,
    changeHisTxtId: 100, //历史记录选中下标
    frequencyT: Date.now(),// input 输入频次，
  },
  onLoad() {
    my.setCanPullDown({ canPullDown: false });
    // comm.pageInit(this);
    comm.pageInitPro(this);
    let sys = app.globalData.sysInfo;
    let winWidth = sys.windowWidth;
    let winHeight = sys.windowHeight;
    let moveScreen = winWidth * 0.95;
    let colorViewWidth = moveScreen * 0.7;
    let rate = winWidth / 750;
    let colorStr = ''
    for (let i = 360; i > 0; i--) {
      colorStr +=  ',hsl('+i+', 100%, 50%)';
    }
    let colorViewsWidth = winWidth * 0.8;
    let colorViewSonWidthTotal = (110 * rate) * 15;
    let colorViewSonWidth = 110 * rate;

    this.setData({
      winWidth: winWidth,
      moveScreen: moveScreen,
      colorStr: colorStr.substr(1),//色环颜色
      colorViewWidth: colorViewWidth,
      colorViewsWidth: colorViewsWidth,
      colorViewSonWidthTotal: colorViewSonWidthTotal,
      colorViewSonWidth: colorViewSonWidth,
      char: [] ,
      newChar:[] ,
      newIndex:[], 
      newIndexArr:[],
      colorArr:[], 
      newColorArr:[],
      onInpTxt:'',
      charBack:{},
    })
    // let v = ["0000000000000000011110111111111001001000000010000101000000001000011000000000100001010011111010000100101000101000010010100010100001001010001010000110101111101000010100000000100001000000000010000100000000001000010000000000100001000000001010000100000000010000","0000000000000000001111000011110001111111111111101111111111111111111111111111111111111111111111111111111111111111011111111111111001111111111111100011111111111100000111111111100000011111111110000000011111100000000000111100000000000000000000000000000000000000","0000000111100000000000011100000000000011110000000000011111110000000001111111000000000111111100000001111111111000001111111111111000111111111111100011111111111110001111111111111000011111111110000000011111110000000001111111000000000111111100000000001111000000","0000000000000000000000001110110000000001111111000000001111111000000001111111110011100111111111111111011111111111011101111111111101110111111111000111011111111000001111111111000000011111100000000011111111000000011100111100000011100000000000001100000000000000"];
    // this.sing(v)
  },
  onShow(){
    //设置头部背景
    my.call("setTitleColor", {
      color: 1184290,
      reset: false
    })
    //如果有缓存则读取之前选中的下标
    let did = app.globalData.device_id;
    let objTenChar = my.getStorageSync({ key: did+'objChar'}).data;
    console.log("objTenChar...",objTenChar)
    if(objTenChar){
      this.setData({
        charBack: objTenChar.objChar.charBack,
        newIndex: objTenChar.objChar.newIndex,
        colorArr: objTenChar.objChar.colorArr,
      })
      this.showDianzhen()
    }
  },
  sing(s){
    console.log("sing...",s)
    let arrStr = []
    s.forEach((item,index) => {
      let arr= item;
      console.log(arr);
      var resView = [];
      for(let i =0 ;i < 256; i++){
          if(arr[i] > 0){
            let j = i % 16;
            let t = Math.floor(i / 16);
            resView.push({left:j*4,top:t*4,c:arr[i]})
          }
      }
      arrStr.push(resView)
    });
    this.setData({arrStr: arrStr,arrNum: arrStr.length}, () => {
      this.scrollPreviewTo(this.data.previewScrollTarget);
    })
    console.log("arrStr::",arrStr)
  },
  TCPcallback(data,cmd){
    console.log("eidtText:::",data);
    if(data['str'] != undefined){
      this.getDianZhen(data['str']);
    }
  },
  focusEnd(){
    const insertAt = this.data.newIndex.length;
    const target = insertAt > 0 ? `preview-cursor-${insertAt - 1}` : 'preview-start';
    this.setData({
      insertAt: insertAt,
      txtIndex: insertAt - 1,
      inputFocused: true,
      onInpTxt: '',
      previewScrollTarget: target
    }, () => {
      this.scrollPreviewTo(target);
    });
  },
  focusStart(){
    const target = 'preview-start';
    this.setData({
      insertAt: 0,
      txtIndex: -1,
      inputFocused: true,
      onInpTxt: '',
      previewScrollTarget: target
    }, () => {
      this.scrollPreviewTo(target);
    });
  },
  inputBlur(){this.setData({inputFocused:false}) },
  onInp(e){
    console.log("onInp::",e.detail.value);
    // 限制频次，防止同一个字被误获取两次
    let t = Date.now();
    let et = this.data.frequencyT;
    if ((t - et) < 50) { return '' }
    
    let char = this.data.char;
    let newChar = this.data.newChar;
    let newIndex = this.data.newIndex;
    let colorArr = this.data.colorArr;
    let h = this.data.h;
    let val = e.detail.value;
    // 去空字符串
    if(val == ' '){ return '' }
    console.log("val::",val)
    //遍历newIndex 长度不包含删除的子元素(00)；
    let len = 0;
    newIndex.forEach((item)=>{
      if(item != '00'){ len += 1 }
    })
    //暂时定为50字符；
    if((len + val.length) > 50){
      my.alert({title:this.data.lang['moreThanFifty']});
      return ''
    }
    //先写入当前位置，再走本地 type=70 转换点阵
    let arrV = val.split('');
    // arrV.forEach((item,inx)=>{
    //   char.push(item);
    //   newChar.push(item);
    //   newIndex.push(item);
    //   colorArr.push(h);
    // })
    let insertAt = Number(this.data.insertAt);
    if (!Number.isInteger(insertAt)) insertAt = newIndex.length;
    insertAt = Math.max(0, Math.min(insertAt, newIndex.length));
    let num = insertAt - 1;
    arrV.forEach((item,inx)=>{
      num = insertAt + inx;
      char.splice(num,0,item);
      newChar.splice(num,0,item);
      newIndex.splice(num,0,item);
      colorArr.splice(num,0,h);
    })
    const target = num >= 0 ? `preview-cursor-${num}` : 'preview-start';
    this.setData({
      char: char,
      newChar: newChar,
      colorArr: colorArr,
      txtIndex: num,
      insertAt: num + 1,
      onInpTxt: '',
      previewScrollTarget: target
    }, () => {
      let data = {
        type: "70",
        msg: {"str": val}
      }
      my.call('sendCmd', data, (res) => {})
    });
    console.log("charchar::",char)
    console.log("newChar::",newChar)

    this.data.frequencyT = t
    return ''
  },
  
  viewInput(){
    // this.setData({inpFocus:false})
    // let that = this;
    // clearTimeout(this.data.inpBlurTimer)
    // this.data.inpBlurTimer=setTimeout(() => {
    //   that.setData({inpFocus:true})
    // }, 500);
  },
  changeTxtIndex(e){
    const index = Number(e.currentTarget.dataset.index);
    if (!Number.isInteger(index)) return;
    const target = `preview-cursor-${index}`;
    this.setData({
      txtIndex: index,
      insertAt: index + 1,
      inputFocused: true,
      onInpTxt: '',
      previewScrollTarget: target
    }, () => {
      this.scrollPreviewTo(target);
    });
  },
  scrollPreviewTo(target){
    if (!target) return;
    const match = /^preview-cursor-(\d+)$/.exec(target);
    const index = match ? Number(match[1]) : -1;
    const viewportWidth = Number(this.data.moveScreen) || 0;
    if (index < 0 || !viewportWidth) {
      this.setData({previewScrollLeft: 0});
      return;
    }

    // Only scroll when the cursor leaves the central visible area. Keeping it
    // near the right side while typing leaves the preceding characters visible.
    const cursorX = 20 + index * 84 + 74;
    const currentLeft = Number(this.data.previewScrollLeft) || 0;
    const leftSafeEdge = currentLeft + viewportWidth * 0.24;
    const rightSafeEdge = currentLeft + viewportWidth * 0.72;
    let nextLeft = currentLeft;

    if (cursorX < leftSafeEdge) {
      nextLeft = cursorX - viewportWidth * 0.24;
    } else if (cursorX > rightSafeEdge) {
      nextLeft = cursorX - viewportWidth * 0.72;
    }

    nextLeft = Math.max(0, Math.round(nextLeft));
    if (nextLeft !== currentLeft) {
      this.setData({previewScrollLeft: nextLeft});
    }
  },
  onPreviewScroll(e){
    this.data.previewScrollLeft = e.detail.scrollLeft || 0;
  },
  getDianZhen(arr){
    // console.log("getDianZhen...",arr)
    let charBack = this.data.charBack;
    charBack = Object.assign(charBack,arr)//合并
    this.setData({charBack: charBack});
    //组装点阵
    this.showDianzhen();
    // let newChar = this.data.newChar;
    // let charStr = []
    // newChar.forEach((itm,i)=>{
    //   // charBack[itm] 有些字不能换算成点阵则为空数组[]
    //   if(charBack[itm].length == 0){//后续处理(自定义一个固定的)
    //     }
    //   let arrS = charBack[itm]
    //   if(arrS != undefined){
    //     charStr.push(arrS.join(""))
    //   }
    // })
    // //显示点阵
    // this.sing(charStr)
  },
  roundColor(e){
    // console.log(e);
    let colorViewWidth = this.data.colorViewWidth;
    let x = e.touches[0].pageX;
    let offsetLeft = e.currentTarget.offsetLeft;
    let left = x - offsetLeft;
    let huafan = colorViewWidth-10;
    left = left < 0 ? 0 : left;
    left = left > huafan ? huafan : left;
    let rate = 360 / huafan;
    let h = Math.round(left * rate);
    console.log(left+"::"+ h);
    this.setData({leftOffset: left , h: h})
  },

  leftTap(){
    let colorViewSonWidth = this.data.colorViewSonWidth;
    let offset = this.data.offset;
    let newOffset= offset-colorViewSonWidth;
    newOffset = newOffset < 0 ? 0 : newOffset
    this.setData({
      offset: newOffset
    })
  },
  rightTap(){
    let diffWidth=this.data.colorViewSonWidthTotal - this.data.colorViewsWidth
    let colorViewSonWidth = this.data.colorViewSonWidth;
    let offset = this.data.offset;
    let newOffset = offset+colorViewSonWidth;
    newOffset = newOffset > diffWidth ? diffWidth : newOffset
    this.setData({
      offset: newOffset
    })
  },
  scroll(e){
    let v = e.detail.scrollLeft;
    this.data.offset = v
  },
  clickImg(e){
    console.log(e.currentTarget.dataset.i);
    let i = e.currentTarget.dataset.i;
    let str = iconData[i];
    //写入input data newChar里;
    let newChar = this.data.newChar;
    let newIndex = this.data.newIndex;
    let colorArr = this.data.colorArr;
    //遍历newIndex 长度不包含删除的子元素(00)；
    let len = 0;
    newIndex.forEach((item)=>{
      if(item != '00'){ len += 1 }
    })
    //暂时定为10字符；
    if(len > 49){
      my.alert({title:this.data.lang['moreThanFifty']});
      return
    }
    let ti = Number(this.data.insertAt);
    if (!Number.isInteger(ti)) ti = newIndex.length;
    ti = Math.max(0, Math.min(ti, newIndex.length));
    let key = "Icon"+i
    // newChar.push(key);
    // newIndex.push(key);
    // colorArr.push(this.data.h);
    newChar.splice(ti,0,key);
    newIndex.splice(ti,0,key);
    colorArr.splice(ti,0,this.data.h);
    const target = `preview-cursor-${ti}`;
    this.setData({
      newChar: newChar,
      newIndex: newIndex,
      colorArr: colorArr,
      txtIndex: ti,
      insertAt: ti + 1,
      previewScrollTarget: target
    });
    //组合点阵
    let arr =[];
    for(let i = 0; i < 16 ; i++){
      let s = str.substr(i*16,16)
      arr.push(s)
    }
    let arrObj ={};
    arrObj[key]=arr;
    // console.log(arrObj);
    this.getDianZhen(arrObj)
  },
  showDianzhen(){
    let charBack = this.data.charBack;
    let newIndex = this.data.newIndex;
    let colorArr = this.data.colorArr;
    let charStr = [];
    let newColorArr = [];// 过滤已经删除的子项颜色
    let newIndexArr = [];// 过滤已经删除的子项
    newIndex.forEach((itm,i)=>{
      // 过滤已经删除的子项
      if(itm != "00"){
        // charBack[itm] 有些字不能换算成点阵则为空数组[]或256个0
        if(charBack[itm].length == 0 || charBack[itm].join("") == "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"){//(自定义一个固定的)
          charBack[itm] = ["0000000000000000","0011110000111100","0111111111111110","1111111111111111","1111111111111111","1111111111111111","1111111111111111","0111111111111110","0111111111111110","0011111111111100","0001111111111000","0001111111111000","0000011111100000","0000001111000000","0000000000000000","0000000000000000"]
        }
        let arrS = charBack[itm]
        if(arrS != undefined){
          charStr.push(arrS.join(""))
        }
        newColorArr.push(colorArr[i])
        newIndexArr.push(newIndex[i])
      }
    })
    console.log("newColorArr,...",newColorArr)
    this.setData({newIndexArr: newIndexArr,newColorArr: newColorArr})
    //显示点阵
    this.sing(charStr)
  },
  delStr(){
    let newIndex = this.data.newIndex;
    let colorArr = this.data.colorArr;
    let txtIndex = this.data.txtIndex
    // let ss =  ["Icon0", "我", "们", "Icon4", "不", "00", "样", "00", "00", "00"];
    let j = 0;
    for (let i = newIndex.length-1; i >= 0 ; i--) {
      if(newIndex[i] != "00"){
        j = i;
        break;
      }
    }
    //添加功能(任意位置删除)
    if(this.data.txtIndex < 100){
      j = txtIndex;
      txtIndex = txtIndex == -1 ? -1 : txtIndex - 1
    }
    console.log("j....",j)
    // newIndex[j] = "00";
    // colorArr[j] = "00";
    newIndex.splice(j,1);
    colorArr.splice(j,1);
    
    this.setData({
      newIndex: newIndex,
      colorArr: colorArr,
      txtIndex: txtIndex,
      insertAt: Math.max(0, txtIndex + 1),
      previewScrollTarget: txtIndex >= 0 ? `preview-cursor-${txtIndex}` : 'preview-start'
    })
    console.log("newIndex.....",newIndex);
    console.log("txtIndex.....",txtIndex);
    console.log("colorArr.....",colorArr);
    //重新显示点阵
    this.showDianzhen();
  },
  sendData(){
    let newIndexArr =  this.data.newIndexArr ;
    let newColorArr =  this.data.newColorArr ;
    let charBack = this.data.charBack;
    let objLen = newIndexArr.length
    if(objLen == 0){  return }
    my.showLoading({ content: 'waiting...' });
    light.control(light.dpid.work_mode, 5).control(light.dpid.text_char_num, objLen).done()
    newIndexArr.forEach((item,index)=>{
      let strArr = charBack[item];
      console.log("strArr....",strArr)
      let newStrArr = [];
      let str16 = ''
      //字符排位
      let num = Number(index).toString(16).padStart(2,"0");
      //颜色
      let color = Math.round(Number(newColorArr[index])).toString(16);
      let color16 =  complement16(color,4)+"03e8ffff";
      //组装竖列的数组
      for (let i = 0; i < 16; i++) {
        let arr= [];
        strArr.forEach((itm,idx)=>{
          // arr += itm[i];
          arr.unshift(itm[i])
        })
        // newStrArr.push(arr);
        newStrArr.push(arr.join(''));
      }
      console.log("newStrArr...",newStrArr)
      newStrArr.forEach((itm,idx)=>{
        let i1 = itm.substr(0,8)
        let i0 = itm.substr(8)
        //二进制转十进制再转16补0
        let i0To16 = complement16((parseInt(i0,2)).toString(16),2);
        let i1To16 = complement16((parseInt(i1,2)).toString(16),2);
        str16 += i0To16 + i1To16;
      })
      console.log("str16...",str16);
      console.log("text_char_point...",num+color16+str16);
      let text_char_point = num+color16+str16;
      // light.control(light.dpid.work_mode, 5).control(light.dpid.text_char_point, text_char_point).done();
      this.sendSetTime(index,text_char_point,objLen);
    })
    //缓存对应的点阵值
    my.setStorageSync({
      key: app.globalData.device_id+'newIndexArr',
      data: {newIndexArr}
    });
    my.setStorageSync({
      key: app.globalData.device_id+'newColorArr',
      data: {newColorArr}
    });
    my.setStorageSync({
      key: app.globalData.device_id+'charBack',
      data: {charBack}
    });
    //返回上一个页面
    // my.navigateBack();
    // 缓存当前发送的文字
    this.storageSendChar()
  },
  sendSetTime(index,val,objLen){
    setTimeout(() => {
      // light.control(light.dpid.work_mode, 5).control(light.dpid.text_char_point, val).done();
      let attr = [1, 2, 37];
      let data = {"1": 1, "2": 5, "37": val }
      light.controlAndroidFast(attr, data);
      console.log("uuuuuuuu....."+index,new Date().getTime())
      // 最后一包
      if((objLen-1) == index){
        //单个设备也加101 102
        let mac = (comm.getDeviceID()).substr(-12);
        let attr = [101, 102];
        let data = {"101":  mac,'102': 1 }
        light.controlAndroidFast(attr, data);

        my.hideLoading(); my.navigateBack()
      }
    }, 350*index);
  },
  
  repairStrForQk(objLen){
    // let qkDevlist = app.globalData.qkDevlist;
    // let qkLen = qkDevlist.length;
    // let n = 0;
    // if(objLen < qkLen){ n = qkLen - objLen }
    // if(objLen > qkLen){
    //   let m = objLen % qkLen;
    //   if(m > 0){n = qkLen - m}
    // }
    let n = this.supplementNum(objLen)
    if(n == 0){
      this.sendQkDevNum(); //发送群组设备数量
    }else{
      let that = this;
      for (let i = 0; i < n; i++) {
        let num = (objLen+i).toString(16).padStart(2,'0');
        let str = (num+"000003e8ffff").padEnd(78,'0');
        setTimeout(()=>{
          let attr = [1, 2, 37];
          let data = {"1": 1, "2": 5, "37": str }
          light.controlAndroidFast(attr, data);
          if(i == (n-1)){
            that.sendQkDevNum(); //发送群组设备数量
          }
        },i*350)
      }
      
    }
  },
  //补报数量
  supplementNum(objLen){
    let qkDevlist = app.globalData.qkDevlist;
    let qkLen = qkDevlist.length;
    let n = 0;
    if(objLen < qkLen){ n = qkLen - objLen }
    if(objLen > qkLen){
      let m = objLen % qkLen;
      if(m > 0){n = qkLen - m}
    }
    return n;
  },
  sendQkDevNum(){
    let qkDevlist = app.globalData.qkDevlist;
    let newList = '';
    qkDevlist.forEach((item) => {
      let str = item['device_id'].substr(-12);
      newList = newList + str;
    });
    let attr = [101, 102];
    let data = {"101": newList ,'102': 1 }
    light.controlAndroidFast(attr, data);
    my.hideLoading(); my.navigateBack()
  },
  storageSendChar(){
    let charBack = this.data.charBack;
    let newIndex = this.data.newIndex;
    let colorArr = this.data.colorArr;
    let objChar = {'charBack': charBack, 'newIndex':newIndex,'colorArr': colorArr}
    let did = app.globalData.device_id;
    my.setStorage({
      key: did+'objChar',
      data: {objChar}
    });
  },
  saveHistroy(){
    my.showLoading({ content: 'waiting...' });
    // 缓存10历史值
    this.storageTenChar()
  },
  storageTenChar(){
    let charBack = this.data.charBack;
    let newIndex = this.data.newIndex;
    let colorArr = this.data.colorArr;
    let arrStr = this.data.arrStr; 
    let changeHisTxtId = this.data.changeHisTxtId; //选中的历史记录下标默认100
    let objChar = {'charBack': charBack, 'newIndex':newIndex,'colorArr': colorArr,'arrStr':arrStr}
    let did = app.globalData.device_id;
    let objTenChar = my.getStorageSync({ key: did+'objTenChar'}).data;
    console.log('objTenChar...',objTenChar)
    let arr = []
    if(objTenChar){
      let objTenCharArr = objTenChar.arr;
      if(changeHisTxtId == 100){
        if(objTenCharArr.length == 10){
          objTenCharArr.pop()
          objTenCharArr.unshift(objChar)
        }else{
          objTenCharArr.unshift(objChar)
        }
      }else{
        objTenCharArr[changeHisTxtId] = objChar
      }
      arr = objTenCharArr;
    }else{
      arr.unshift(objChar)
    }
    my.setStorage({
      key: did+'objTenChar',
      data: {arr}
    });
    this.setData({changeHisTxtId: 100})
    setTimeout(()=>{
      my.hideLoading();
    },1000)
  },
  
  showHistroy(){
    let did = app.globalData.device_id;
    let objTenChar = my.getStorageSync({ key: did+'objTenChar'}).data;
    if(objTenChar){
      let objTenCharArr = objTenChar.arr;
      if(objTenCharArr.length > 0){
        console.log("objTenCharArr...",objTenCharArr)
        this.setData({histroy:true,objTenCharArr: objTenCharArr})
      }
    }

  },
  closeModel(){
    this.setData({histroy:false})
  },
  changeHisTxt(e){
    // console.log(e.currentTarget.id)
    let i = e.currentTarget.id;
    let objTenCharArr = this.data.objTenCharArr;
    this.setData({
      charBack: objTenCharArr[i].charBack,
      newIndex: objTenCharArr[i].newIndex,
      colorArr: objTenCharArr[i].colorArr,
      changeHisTxtId: i,
    })
    this.showDianzhen()
  },
});
