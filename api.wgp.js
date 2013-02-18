wagapi = function (){

	var that = this;
	
	var isConnected = false;

	//http://stackoverflow.com/questions/899102/how-do-i-store-javascript-functions-in-a-queue-for-them-to-be-executed-eventuall
	this.queue = new (function(){
		var isOn = false;
		var stack = [];
		this.push = function(fn,context,params,callback){
			//var fn1 = wrapFunction(fn,context,params,callback);
			//console.log('action requested'+params['action']);
			stack.push(wrapFunction(fn,context,params,callback));
			//(stack.shift())();
			this.next({released:false});
		}
		this.next = function(reqObject){
			//console.log('queue.isOn='+isOn);
			//console.log('isConnected='+isConnected);
			//console.log('Remaining queue elements'+stack.length);*
			if(reqObject.released){isOn=false;}
			if(stack.length == 0){return false;}
			if(!isOn){
				isOn=true;
				if(!isConnected){
					//console.log('Performing connection');
					that.connect(function(){});
				}else{
					//console.log('Executing next function in line');
					setTimeout(stack.shift(),100);
					//(stack.shift())();
				}
			}
		};
		
		var wrapFunction = function(fn, context, params,callback) {
			return function() {
				fn.call(context, params, callback);
			};
		};
		/*this.start = function(){
			if(!isConnected){that.connect(function(){});}
			if(isOn){return true;}
			while (stack.length > 0 && isOn) {
				next();   
			}
		}*/
	})();
	
	//Default values can be set here
	var authParameters = {
		username:undefined,
		password:undefined,
		key:'AE7D9862AEB1234C',
		auth_mode:0
	};
	
	var sessionParameters = {
		auth_token: undefined,
		account_id: undefined	
	};
	
	var serverParameters = {
		url:	'127.0.0.1',
		port:	'80'
	};

	//Set authentication parameters
	this.setAuthParameters=function(data){
		authParameters = data;
	}
	
	//Set server properties
	this.setServerParameters=function(data){
		serverParameters = data;
	}	
	
	//Set authentication username
	this.setUsername=function(username){
		authParameters['username'] = username;
	}	

	//Set authentication password
	this.setPassword=function(password){
		authParameters['password'] = password;
	}	
	//Set authentication api_key
	this.setApiKey=function(key){
		authParameters['key'] = key;
	}	
	//Set authentication mode
	this.setAuthMode=function(auth_mode){
		authParameters['auth_mode'] = auth_mode;
	}
	
	this.setAuthToken=function(auth_token){
		sessionParameters['auth_token'] = auth_token;
	}
	
	this.setAccountId=function(account_id){
		sessionParameters['account_id'] = account_id;
	}	
	/*
	this.getSessionParameters=function(){
		return sessionParameters['account_id'];
	}*/
	
	this.getApiCallAdress=function(action){
		if(action=="/access/account"){
			return 'http://'+serverParameters['url']+':'+serverParameters['port']+"/wgp/api"+action;
		}else{
			return 'http://'+serverParameters['url']+':'+serverParameters['port']+"/wgp/api"+"/"+sessionParameters['account_id']+action;
		}
	}
	
	this.getAppAdress=function(){
			return 'http://'+serverParameters['url']+':'+serverParameters['port']+"/wgp";
	}	

	//Authentify against the server
	this.connect=function(callback){
		var input = [
						'user='+authParameters['username'],
						'password='+authParameters['password'],
						'key='+authParameters['key']
					].join('&');
				$.ajax({
					type: "GET",
					url : this.getApiCallAdress("/access/account"),
					data: input,
					dataType: "JSON",
					/*success: function(data){
						(function(data,callback){
							that.setAuthToken(data['auth_token']);
							that.setAccountId(data['account_id']);
							isConnected=true;
							var status = 200;
							if(callback[status]!=undefined){(callback['200'])(data)};
							that.queue.next({released:true,result:200});
						})(data,callback);
					},*/
					/*statusCode: {
						200:function(data){
							if(callback['200']!=undefined){(callback['200'])(data);that.queue.next({released:true,result:200});}
						}
						401: 	(function(callback){
									that.queue.next({released:true,result:401});
									(callback['401'])();
								})(callback)					
					},*/
					success: function(data){
						var status = 200;
						(function(data,callback){
							that.setAuthToken(data['auth_token']);
							that.setAccountId(data['account_id']);						
							isConnected=true;
							if(callback!=undefined && callback[status]!=undefined){
								(callback[status])(data);
							}
							that.queue.next({released:true,result:status});
						})(data,callback);
						
					},
					error: function(jqXHR){
						var status = jqXHR.statusCode();
						(function(){
							if(callback!=undefined && callback[status]!=undefined){
								(callback[status])();
							}
							that.queue.next({released:true,result:status});
						})();						
					}
				});	
	}
	
	//Authentify against the server
	this.doRequest = function(obj,callback){
		//console.log('Performing doRequest');
		//console.log('Type of input'+typeof obj);
		var request = Array();
		if(typeof obj != 'undefined' && typeof obj['action'] != 'undefined'){
			//console.log('Valid parameters provided');
			//console.log('action requested : '+obj['action']);
			/*if(typeof obj['input'] != 'undefined'){		
				$.each(obj['input'],function(index,value){
					input.push(index+"="+value);
				});
			}*/
			$.ajax({
				type: "GET",
				url: this.getApiCallAdress(obj.action),
				data: 'data='+JSON.stringify(obj['input']),
				dataType: "JSON",
				beforeSend: function(xhr){
								/*if(typeof obj['input'] != 'undefined'){
									$.each(obj['input'],function(index,value){
									xhr.setRequestHeader(index, value);
								});}	*/			
								xhr.setRequestHeader('auth_token', sessionParameters['auth_token']);
								xhr.setRequestHeader('key', authParameters['key']);
							},
				/*success: function(data){
						(function(data,callback){
							if(typeof obj['callback'] != 'undefined'){callback(data);}
							that.queue.next({released:true,result:200});
						})(data,callback);				
					
				}*/
				success: function(data){
					var status = 200;
					(function(data,callback){
						//console.log(typeof(callback));
						//console.log('Performing callback');
						if(callback!=undefined && callback[status]!=undefined){
							(callback[status])(data);
						}
						//callback(data);
						that.queue.next({released:true,result:status});
					})(data,callback);
					
				},
				error: function(jqXHR){
					var status = jqXHR.statusCode();
					(function(){
						if(callback!=undefined && callback[status]!=undefined){
							(callback[status])();
						}
						that.queue.next({released:true,result:status});
					})();						
				}				
			});	
		}
	}

	this.request = function(obj,callback){
		this.queue.push(that.doRequest,that,obj, callback);
	}
	
	this.listDocsFromPath = function(data,callback){
		//console.log(typeof(callback));
		if(data!=undefined){
			var obj={
				input: data,
				action : '/list/docs/from/path'
			};
			this.request(obj,callback);
		}
		else if(data==undefined && callback[400]!=undefined){(callback[400])();}
	}
	
	this.listTagsAll = function(callback){
			var obj={
				action : '/list/tags/all'
			};
			this.request(obj,callback);
	}
	
	this.addDocsToPath = function(data,callback){
		if(data!=undefined){
			var obj={
				input: data,
				action : '/add/docs/to/path'
			};
			this.request(obj,callback);
		}
		else if(data==undefined && callback[400]!=undefined){(callback[400])();}
	}

	this.remDocsFromPath = function(data,callback){
		if(data!=undefined){
			var obj={
				input: data,
				action : '/rem/docs/from/path'
			};
			this.request(obj,callback);
		}
		else if(data==undefined && callback[400]!=undefined){(callback[400])();}
	}
	
	this.linkDocs = function(data,callback){
		if(data!=undefined){
			var obj={
				input: data,
				action : '/link/docs'
			};
			this.request(obj,callback);
		}
		else if(data==undefined && callback[400]!=undefined){(callback[400])();}
	}
/*	
	this.downloadDoc = function(data){
		var iframe = document.createElement("iframe");
		iframe.style.display = "none";
		iframe.src = this.getApiCallAdress('/download/doc')+'/'+sessionParameters['auth_token']+'/'+data['id'];
		document.body.appendChild(iframe); 		
	}
*/	
	this.accessUpload = function(data,callback){
		if(data!=undefined){
			var obj={
				input: data,
				action : '/access/upload'
			};
			this.request(obj,callback);
		}
		else if(data==undefined && callback[400]!=undefined){(callback[400])();}
	}
	
	this.getUploadLink = function(data){
		return this.getApiCallAdress('/upload')+'/upload/'+sessionParameters['auth_token'];
	}

	
};


/*
function event(){
	var status;
	var code;
	var type;
}
*/
