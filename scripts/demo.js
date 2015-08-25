window.onload = initPage;

var coursesURL = 'http://study.163.com/webDev/couresByCategory.htm';
var hotCoursesURL = 'http://study.163.com/webDev/hotcouresByCategory.htm';
var followURL = 'http://study.163.com/webDev/attention.htm';
var loginURL = 'http://study.163.com/webDev/login.htm';
var videoURL = 'http://mov.bn.netease.com/open-movie/nos/mp4/2014/12/30/SADQ86F5S_shd.mp4 ';

//页面加载后的初始函数
function initPage(){
 	message();
	slide();	
	tab();
	paging();
	video();
	follow();
	getData(new dataObject(coursesURL, {'pageNo': '1', 'psize': '20', 'type': '10'}));
	getData(new dataObject(hotCoursesURL, {}));
}


/*实现顶部消息栏交互*/
function message(){
	var messageDiv = getElementByClassName('m-message');
	var cancelDiv = getElementByClassName('m-cancel');
	if(getCookie('message') == '0'){							//判断cookie，为0则隐藏消息栏
		messageDiv.style.zIndex = '-1000';
	}

	cancelDiv.onclick = cancel;

	function cancel(){											//点击“不再提醒”隐藏消息栏，并重设cookie
		changeCookie('message', '0');
		messageDiv.style.zIndex = '-1000';
	}
}

/*实现轮播图交互 */
function slide(){
	var mSlide = getElementByClassName('m-slide');
	var img = mSlide.getElementsByTagName('img');
	var ctl = mSlide.getElementsByTagName('span');
	var link = mSlide.getElementsByTagName('a');
	var href = ["http://open.163.com/","http://study.163.com/",
				"http://www.icourse163.org/"];
	var firstSet = true;										//页面第一次载入，用于启用fadeout函数
	var fadeFlag = false;										//用于控制fadeout函数
	var stepFlag = false; 										//用于控制step函数
	
	addEventHandler(mSlide, 'mouseenter', hoverEvent);
	addEventHandler(mSlide, 'mouseleave', leaveEvent);
	for(var i=0; i< ctl.length; i++){
		ctl[i].onclick = ctlClickEvent;
	}

	var fadeout = function(num){								//用于实现图片500ms淡入淡出效果，每次
		if(fadeFlag){											//调用时遍历一次图片，指定的图片透明度加
			return;												//0.002，未指定且透明度非0的图片减0.002，
		}														//通过setTimeout递归实现1ms间隔调用

		for(var i=0; i<img.length; i++){												
			if(i == num){																
				img[i].style.opacity = String(Number(img[i].style.opacity) + 0.002);
			} else if(img[i].style.opacity != '0'){
				img[i].style.opacity = String(Number(img[i].style.opacity) - 0.002);
			}
		}

		if(img[num].style.opacity == '1'){
			clearTimeout(timer2);
		}else {
			timer2 = setTimeout(function(){fadeout(num)}, 1); 
			firstSet = false;
		}
		
	}

	var step = function(){										//用于实现图片每5s一次的切换，每次调用时
		if(stepFlag){											//遍历一次图片，找出下一张应该显示的图片序号，
			clearTimeout(timer1);								//调用fadeout函数实现切换，通过setTimeout递归		
			return;												//实现5s间隔调用
		}														
		for(var i=0; i<img.length; i++){
			if(img[i].style.opacity == '1'){
				var j = i + 1;
				if(j == 3){
					j = 0;
				}
				fadeout(j);
			}
		}
		var timer1 = setTimeout(step, 5000);
	}

	function hoverEvent() {										//用于实现鼠标悬停时图片暂停效果，
		stepFlag = true;										//每次调用时遍历一次图片，将透明度
		fadeFlag = true;										//大于等于0.5的图片的透明度设置为1，
		for(var i=0; i<img.length; i++){						//并且给<a>标签设置对应的链接，
			if(Number(img[i].style.opacity) >= 0.5){			//另外两张图片透明度设置为0
				img[i].style.opacity = '1';
				link[0].setAttribute("href", href[i]);
			}else{
				img[i].style.opacity = '0';
			}
		}
	}

	function leaveEvent() {										//用于实现鼠标离开图片时，重新启用轮播效果
		stepFlag = false;
		fadeFlag = false;
		setTimeout(step, 5000);
	}

	function ctlClickEvent() {									//用于实现鼠标点击圆点时的图片切换和更换链接，
		var imgNum = Number(this.className.charAt(3));			//通过获取点击对象的class属性获得指定图片
		if(img[imgNum].style.opacity == '1'){					//序号，当此图片正在页面显示时，返回。
			return;												//当此图片并未显示时，调用fadeout函数实现
		}else{													//图片切换，并且给<a>标签更换对应的链接
			link[0].setAttribute('href', href[imgNum]);
			fadeFlag = false;
			if(firstSet){
				fadeout(imgNum);
			} else{
				clearTimeout(timer2);
				fadeout(imgNum);
			}
			
			
		}
	}	

	setTimeout(step, 5000);
}

/*实现AJAX异步取得数据及展示*/
function getData(obj){
    /*用于url编码*/
    function encodeData(_data){
    	var arr = [];
        for (var i in _data) { 
            arr.push(encodeURIComponent(i) + '=' + encodeURIComponent(_data[i]));
        }
        return arr.join('&');
    }

 	if(obj.url == coursesURL){									//当url为课程数据链接时
 		var coursesRequest = createRequest();
 		obj.url = obj.url + '?rand=' + Math.random();
 		obj._data = encodeData(obj._data);
	    obj.url += obj.url.indexOf('?') == -1 ? '?' + obj._data : '&' + obj._data;
		
		/*回调函数*/
		function displayCourses(){
			if(coursesRequest.readyState == 4){
				if(coursesRequest.status == 200){
					var courseMenu = getElementByClassName('g-mn');
					var courses = JSON.parse(coursesRequest.responseText);

					for(var i=courseMenu.childNodes.length; i>0; i--){
						courseMenu.removeChild(courseMenu.childNodes[i-1]);
					}

					var pageSize = courses['pagination'].pageSize;
					var coursesList = courses['list'];

					function divHover(){						//鼠标移上去时课程名颜色改变（但被浮层遮住了）
						var name = this.getElementsByTagName('p')[0];
						name.style.color = '#39a030';
					}

					function divLeave(){						//鼠标移开时课程名颜色恢复
						var name = this.getElementsByTagName('p')[0];
						name.style.color = '#333333';
					}

					/*用于创建鼠标悬停浮层*/
					function display(){
						if(getElementByClassName('m-hover')){	//如果已有一个鼠标悬停浮层，则返回
							return;
						}
						var hoverDiv = document.createElement('div');
						var midPhoto = document.createElement('img');
						var courseName = document.createElement('p');
						var provider = document.createElement('p');
						var learnericon = document.createElement('span');
						var learnerCount = document.createElement('p');
						var categoryName = document.createElement('p')
						var descriptions = document.createElement('p');

						var rectTop = this.offsetTop - 10;		//获取对象的坐标
						var rectLeft = this.offsetLeft - 10;

						for(var i=0; i<this.childNodes.length; i++){
							if(this.childNodes[i].className == 'name'){
								courseName.appendChild(document.createTextNode(this.childNodes[i].firstChild.nodeValue));
							}else if(this.childNodes[i].className == 'provider'){
								provider.appendChild(document.createTextNode('发布者 : ' + this.childNodes[i].firstChild.nodeValue));
							}else if(this.childNodes[i].className == 'count'){
								learnerCount.appendChild(document.createTextNode(this.childNodes[i].firstChild.nodeValue + '人在学'));
							}else if(this.childNodes[i].className == 'categoryName'){
								categoryName.appendChild(document.createTextNode('分类 : ' + this.childNodes[i].firstChild.nodeValue));
							}else if(this.childNodes[i].className == 'descriptions'){
								var text = this.childNodes[i].firstChild.nodeValue.replace(/(^\s*)|(\s*$)/g,'');
									text = text.replace(/\s/g,"");
    								text = text.replace(/，/ig, ',');
    								text = text.replace(/。/ig, '.');
    								text = text.replace(/？/ig, '?');
    								text = text.replace(/！/ig, '!');
								if(text.length > 67){		//字数过多时删去多余部分并在其后添加省略号(效果不佳)
									text = text.substr(0, 65) + '...';
								}
								descriptions.appendChild(document.createTextNode(text));
							}
						}

						midPhoto.setAttribute('src', this.getElementsByTagName('img')[0].src);
						hoverDiv.setAttribute('class', 'm-hover');
						courseName.setAttribute('class', 'name');
						provider.setAttribute('class', 'provider');
						learnerCount.setAttribute('class', 'count');
						categoryName.setAttribute('class', 'category');
						descriptions.setAttribute('class', 'descriptions');

						hoverDiv.style.top = String(rectTop) + 'px';
						hoverDiv.style.left = String(rectLeft) + 'px';

						hoverDiv.appendChild(midPhoto);
						hoverDiv.appendChild(courseName);
						hoverDiv.appendChild(provider);
						hoverDiv.appendChild(learnericon);
						hoverDiv.appendChild(learnerCount);
						hoverDiv.appendChild(categoryName);
						hoverDiv.appendChild(descriptions);
						courseMenu.appendChild(hoverDiv);

						addEventHandler(hoverDiv, 'mouseleave', hidden);
					}

					function hidden(){							//鼠标移开时删去悬停浮层
						this.parentNode.removeChild(this);
					}


					for(var i=0; i<pageSize; i++){			//DOM创建html元素*/
						var coursedetails = coursesList[i];

						var courseDiv = document.createElement('div');
						var midPhoto = document.createElement('img');
						var courseName = document.createElement('p');
						var provider = document.createElement('p');
						var learnericon = document.createElement('span');
						var learnerCount = document.createElement('p');
						var price = document.createElement('p');
						var categoryName = document.createElement('p');
						var descriptions = document.createElement('p');

						midPhoto.setAttribute('src', coursedetails.middlePhotoUrl);
						courseName.setAttribute('class', 'name');
						courseName.appendChild(document.createTextNode(coursedetails.name));
						provider.setAttribute('class', 'provider');
						provider.appendChild(document.createTextNode(coursedetails.provider));
						learnerCount.setAttribute('class', 'count');
						learnerCount.appendChild(document.createTextNode(coursedetails.learnerCount));
						price.setAttribute('class', 'price');
						price.appendChild(document.createTextNode('￥' + coursedetails.price));
						categoryName.setAttribute('class', 'categoryName');
						categoryName.appendChild(document.createTextNode(coursedetails.categoryName));
						descriptions.setAttribute('class', 'descriptions');
						descriptions.appendChild(document.createTextNode(coursedetails.description));						

						learnerCount.appendChild(learnericon)
						courseDiv.appendChild(midPhoto);
						courseDiv.appendChild(courseName);
						courseDiv.appendChild(provider);
						courseDiv.appendChild(learnerCount);
						courseDiv.appendChild(price);
						courseDiv.appendChild(categoryName);
						courseDiv.appendChild(descriptions);
						courseMenu.appendChild(courseDiv);

						addEventHandler(courseDiv, 'mouseenter', divHover);
						addEventHandler(courseDiv, 'mouseenter', display);
						addEventHandler(courseDiv, 'mouseleave', divLeave);

					}
				}
			}
		}

		coursesRequest.open('GET', obj.url, true);
		coursesRequest.onreadystatechange = displayCourses;
		coursesRequest.send(null);

 	}else if(obj.url == hotCoursesURL){				//当url为热门课程数据链接时
 		var hotCoursesRequest = createRequest();
 		obj.url = obj.url + '?rand=' + Math.random();

 		/*回调函数*/
 		function displayHotCourses(){
 			if(hotCoursesRequest.readyState == 4){
 				if(hotCoursesRequest.status == 200){
 					var hotCoursesDiv = getElementByClassName('hotclass');
 					var hotCourses = JSON.parse(hotCoursesRequest.responseText);

 					/*定时循环函数，用于刷新热门课程及展示*/
 					function stepUpdate(){
 						var randomNum = [];
	 					while(randomNum.length < 10){		//获取10个在0至19之间的随机数，实现随机展示
	 						var num = Math.floor(Math.random()*20);
	 						var flag = true;
	 						for(i in randomNum){
	 							if(num == randomNum[i]){
	 								flag = false;
	 							}
	 						}
	 						if(flag){
	 							randomNum.push(num);
	 						}
	 					}

	 					for(var i=hotCoursesDiv.childNodes.length; i>0; i--){			//清除之前已有的元素
	 						if(!i){
	 							break;
	 						}else{
	 							hotCoursesDiv.removeChild(hotCoursesDiv.childNodes[i-1]);
	 						}
	 					}

	 					for(var i=0; i<10; i++){			//DOM创建html元素
	 						var coursedetails = hotCourses[randomNum[i]];

	 						var courseDiv = document.createElement('div');
	 						var smallPoto = document.createElement('img');
	 						var courseName = document.createElement('p');
	 						var learnericon = document.createElement('span');
	 						var learnerCount = document.createElement('p');

	 						if(i == 0){
	 							courseDiv.setAttribute('class', ' first');
	 						}
	 						smallPoto.setAttribute('src', coursedetails.smallPhotoUrl);
	 						courseName.setAttribute('class', 'name');
	 						courseName.appendChild(document.createTextNode(coursedetails.name));
	 						learnerCount.setAttribute('class', 'count');
	 						learnerCount.appendChild(document.createTextNode(coursedetails.learnerCount));

	 						courseDiv.appendChild(smallPoto);
	 						courseDiv.appendChild(courseName);
	 						courseDiv.appendChild(learnericon);
	 						courseDiv.appendChild(learnerCount);
	 						hotCoursesDiv.appendChild(courseDiv);
	 					}

	 					setTimeout(stepUpdate, 5000);
	 				}

	 				stepUpdate();
				}
 			}
 		}

 		hotCoursesRequest.open('GET', obj.url, true);
 		hotCoursesRequest.onreadystatechange = displayHotCourses;
 		hotCoursesRequest.send(null);
 	
 	}else if(obj.url == loginURL){						//当url为登陆链接时
 		var loginRequest = createRequest();
 		obj.url = obj.url + '?rand=' + Math.random();
 		obj._data = encodeData(obj._data);
	    obj.url += obj.url.indexOf('?') == -1 ? '?' + obj._data : '&' + obj._data;

	    /*回调函数*/
	    function judge(){
	    	if(loginRequest.readyState == 4){
	    		if(loginRequest.status == 200){
	    			var flag = JSON.parse(loginRequest.responseText);
	    			var mlogin =getElementByClassName('m-login');
	    			var mfollow = getElementByClassName('m-follow');
					var mfollow2 = getElementByClassName('m-follow2');
					var mfollowed = getElementByClassName('m-followed');
	    			var inputs = mlogin.getElementsByTagName('input');
	    			var mmask = getElementByClassName('m-mask');

	    			if(flag){							//如果服务端返回1，隐藏登陆弹窗，并设置cookie
	    				changeCookie('loginSuc', '1');
	    				mlogin.style.zIndex = '-1000';
	    				mlogin.style.opacity = '0';
	    				mmask.style.opacity = '0';
						mmask.style.zIndex = '-500';
						mfollowed.style.zIndex = '20';
						mfollow.style.zIndex = '-1000';
						mfollow2.style.zIndex = '-1000';
						changeCookie('followSuc', '1');
	    			}else {
	    				inputs[1].value = '账号或密码错误，请重新输入';
	    			}
	    		}
	    	}
	    }

	    loginRequest.open('GET', obj.url, true);
	    loginRequest.onreadystatechange = judge;
	    loginRequest.send(null);
 	}
}

/*实现关注按钮及用户登陆交互*/
function follow(){
	var mfollow = getElementByClassName('m-follow');
	var mfollow2 = getElementByClassName('m-follow2');
	var mfollowed = getElementByClassName('m-followed');
	var cancel = mfollowed.getElementsByTagName('a')[0];
	var mlogin = getElementByClassName('m-login');
	var mmask = getElementByClassName('m-mask');
	var span = mlogin.getElementsByTagName('span')[0];
	var inputs = mlogin.getElementsByTagName('input');
	var submit = inputs[2];
	span.onclick = hidden;
	submit.onclick = submitClick;
	mfollow.onclick = followClick;
	cancel.onclick = unFollow;
	for(var i=0; i<2; i++){
		inputs[i].onclick = remove;
	}
	if(getCookie('followSuc') == '1'){					//第一次加载页面时判断cookie，为1则显示“已关注”
		mfollowed.style.zIndex = '20';
		mfollow.style.zIndex = '-1000';
		mfollow2.style.zIndex = '-1000';
	}else{
		mfollowed.style.zIndex = '-1000';
		mfollow.style.zIndex = '20';
		mfollow2.style.zIndex = '20';
	}

	function hidden(){									//用于实现点击关闭按钮后隐藏登陆弹窗效果
		mlogin.style.zIndex = '-1000';
		mlogin.style.opacity = '0';
		mmask.style.opacity = '0';
		mmask.style.zIndex = '-500';
	}

	function submitClick(){								//用于实现点击登陆按钮后将客户端数据加密并送往服务端
		var username = hex_md5(inputs[0].value);
		var password = hex_md5(inputs[1].value);
		getData(new dataObject(loginURL, {'userName': username, 'password': password}));
	}

	function remove(){									//点击输入框清除默认值
		this.value = '';
	}

	function followClick(){								//点击关注按钮，判断cookie，若未登录则显示登陆弹窗
		var cookie = getCookie('loginSuc');
		if(cookie == '1'){
			mfollowed.style.zIndex = '20';
			mfollow.style.zIndex = '-1000';
			mfollow2.style.zIndex = '-1000';
			changeCookie('followSuc', '1');
		}else{
			mlogin.style.zIndex = '1000';
			mlogin.style.opacity = '1'
			mmask.style.zIndex = '500';
			mmask.style.opacity = '0.8';
		}
	} 

	function unFollow(){								//点击取消按钮，变为未登录，重设cookie
		changeCookie('followSuc', '0');
		mfollowed.style.zIndex = '-1000';
		mfollow.style.zIndex = '20';
		mfollow2.style.zIndex = '20';
	}
}

/*用于实现课程列表底部的分页栏交互*/
function paging(){
	var mpaging = getElementByClassName('m-paging');
	var spanDiv = mpaging.getElementsByTagName('div');
	var icons = mpaging.getElementsByTagName('img');

	for(var i=0; i<icons.length; i++){
		icons[i].onclick = iconClick; 
	}


	for(var i=1; i<9; i++){
		var span = document.createElement('span');
		span.appendChild(document.createTextNode(i));
		if(i == 1){
			span.setAttribute('class', 'select');
		}

		span.onclick = spanClick;
		spanDiv[0].appendChild(span);
	}

	function spanClick(){								//点击页码按钮，若不为当前页则将课程页面更新为对应页
		if(!this.className){
			var spans = mpaging.getElementsByTagName('span');
			for(var i=0; i<spans.length; i++){
				if(spans[i].className){
					spans[i].removeAttribute('class');
				}
			}
			this.setAttribute('class', 'select');
			var pageNo = this.firstChild.nodeValue;
			var tabs = getElementByClassName('m-tab').getElementsByTagName('span');
			for(var i=0; i<tabs.length; i++){
				if(tabs[i].className){
					var type = '';
					i == 0 ? type = '10' : type = '20';
				}
			}
			getData(new dataObject(coursesURL, {'pageNo': pageNo, 'psize': '20', 'type': type}))
		}
	}

	function iconClick(){								//点击向前向后按钮，更新页码按钮
		if(this.className == 'ico-back'){
			if(spanDiv[0].firstChild.firstChild.nodeValue != '1'){
				var pageNo = String(Number(spanDiv[0].firstChild.firstChild.nodeValue) - 1);
				spanDiv[0].removeChild(spanDiv[0].lastChild);
				var span = document.createElement('span');
				span.onclick = spanClick;
				span.appendChild(document.createTextNode(pageNo));
				spanDiv[0].insertBefore(span, spanDiv[0].firstChild);
			}
		} else{
			var pageNo = String(Number(spanDiv[0].lastChild.firstChild.nodeValue) + 1);
			spanDiv[0].removeChild(spanDiv[0].firstChild);
			var span = document.createElement('span');
			span.onclick = spanClick;
			span.appendChild(document.createTextNode(pageNo));
			spanDiv[0].appendChild(span);
		}
	}
}

/*实现TAB按钮交互*/
function tab(){
	var mtab = getElementByClassName('m-tab');
	var tabs = mtab.getElementsByTagName('span');
	for(var i=0; i<tabs.length; i++){
		tabs[i].onclick = tabClick;
	}

	function tabClick(){								//点击TAB按钮，若不为当前课程类型，则更新课程页面
		if(!this.className){
			tabs[0].removeAttribute('class');
			tabs[1].removeAttribute('class');
			this.setAttribute('class', 'select');
			for(var i=0; i<tabs.length; i++){
				if(tabs[i].className){
					var type = '';
					i == 0 ? type = '10' : type = '20';
					getData(new dataObject(coursesURL, {'pageNo': '1', 'psize': '20', 'type': type}));
				}

			}
		}
	}	
}

/*实现视频弹窗交互*/
function video(){
	var videoIMG = getElementByClassName('g-sdc2').getElementsByTagName('img')[0];
	var mfloat = getElementByClassName('m-float');
	var mmask = getElementByClassName('m-mask');
	var span = mfloat.getElementsByTagName('span')[0];
	var video = mfloat.getElementsByTagName('video')[0];
	videoIMG.onclick = playVideo;
	span.onclick = hideVideo;

	function playVideo(){								//点击视频预览图，出现视频弹窗
		mfloat.style.zIndex = '1000';
		mfloat.style.opacity = '1'
		mmask.style.zIndex = '500';
		mmask.style.opacity = '0.8';
	}

	function hideVideo(){								//点击关闭按钮关闭视频并隐藏视频弹窗
		video.currentTime = 0;
		video.pause();
		mfloat.style.zIndex = '-1000';
		mfloat.style.opacity = '0'
		mmask.style.opacity = '0';
		mmask.style.zIndex = '-500';
	}
}

/*对象构造器*/
function dataObject(url, data){
	this.url = url;
	this._data = data;
}

/*用于创建请求对象*/
function createRequest() {								
  if (typeof XMLHttpRequest != 'undefined') {
        //for IE7+, Firefox, Chrome, Opera, Safari
        return new XMLHttpRequest();
    } else if (typeof ActiveXObject != 'undefined') {
        //for IE6, IE5
        var version = [
                                    'MSXML2.XMLHttp.6.0',
                                    'MSXML2.XMLHttp.3.0',
                                    'MSXML2.XMLHttp'
        ];
        for (var i = 0; version.length; i ++) {
            try {
                return new ActiveXObject(version[i]);
            } catch (e) {
                //跳过
            }    
        }
    } else {
        throw new Error('您的系统或浏览器不支持XHR对象！');
    }
}

/*用于为同一个对象注册多个事件*/
function addEventHandler(obj, eventName, handler){
  if(document.addEventListener){
    obj.addEventListener(eventName, handler, false);
  }else if(document.attachEvent){
    obj.attachEvent("on" + eventName, handler);
  }
}

/*用于通过class获取一个对应的元素*/
function getElementByClassName(matchClass){
	var elems = document.getElementsByTagName('*');
	for(var i=0; i< elems.length; i++){
		if((' ' + elems[i].className + ' ').indexOf(' ' + matchClass + ' ') > -1){
			return elems[i];
		}
	}
}

/*用于获取对应cookie的值*/
function getCookie(_name){
	var name = _name + "=";
	var cookies = document.cookie.split(';');
	for(var i=0; i<cookies.length; i++) {
		var c = cookies[i].replace(/(^\s*)|(\s*$)/g,'');
		if (c.indexOf(name)==0) return c.substring(name.length,c.length);
	}
	return "";
}

/*用于更改对应cookie的值*/
function changeCookie(_name, value){
	document.cookie = _name + '=' + value;
}