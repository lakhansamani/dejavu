/*
    This is the file which commands the data update/delete/append.
    Any react component that wishes to modify the data state should 
    do so by flowing back the data and calling the `reset` function
    here. This is sort of like the Darth Vader - Dangerous and
    Commands everything !

    ref: https://facebook.github.io/react/docs/two-way-binding-helpers.html

*/

var HomePage = React.createClass({
    getInitialState: function() {
        return {documents: [{}], types: []};
    },
    viewJSON: function(data, event){
        var view = document.getElementById("json-view");
        view.innerHTML = JSON.stringify(data);
    },
    flatten: function(data, callback) {
        var fields = [];
        for(var each in data){
            if(typeof data[each] !== 'string'){
                if(typeof data[each] !== 'number'){
                    if(each !== '_source')
                        fields.push(each);
                }
            }
        }
        for(var each in data['_source']){
            data[each] = data['_source'][each];
            if(typeof data[each] !== 'string'){
                if(typeof data[each] !== 'number'){
                        fields.push(each);
                }
            }
        }
        if(data['_source'])
            delete data['_source'];
        if(data['_index'])
            delete data['_index'];
        return callback(data, fields);
    },
    showJSON: function(data, event){
        React.render(<Modal show={data}/>, document.getElementById('modal'));
    },
    injectLink: function(data, fields) {
        var ID = data['_id'];
        data['json'] = <a href="#" onClick={this.showJSON.bind(null, data)}><i className="fa fa-external-link"></i></a>;
        for(var each in fields){
            data[fields[each]] = <a href="#" onClick={this.showJSON.bind(null, data[fields[each]])}><i className="fa fa-external-link"></i></a>;
        }
        return data;
    },
    revertTransition: function(elem){
        elem.style.background = 'white';
    },
    updateTransition: function(_key){
        var elem = document.getElementById(_key);
        elem.style.background = '#F4A460';
        setTimeout(this.revertTransition.bind(null, elem), 500);
    },
    deleteTransition: function(key){
        var elem = document.getElementById(key);
        elem.style.background = '#CC0033';
        setTimeout(this.revertTransition.bind(null, elem), 500);
    },
    newTransition: function(_key){
        var elem = document.getElementById(_key);
        elem.style.background = '#33FF33';
        setTimeout(this.revertTransition.bind(null, elem), 500);
    },
    deleteRow: function(index){
        delete sdata[index];
    },
    reset: function(){
        this.setState({documents: sdata});
    },
    getStreamingData: function(typeName){
        // Logic to stream continuous data
        feed.getData(typeName, function(update){
            update = this.flatten(update, this.injectLink);
            var got = false;
            var index = -1;
            for(var each in sdata){
                    if(sdata[each]['_id'] === update['_id']){
                        if(sdata[each]['_type'] === update['_type']){
                            sdata[each] = update;
                            got = true;
                            index = each;
                            break;
                        }
                    }
            }
            if(update['_deleted']){
                for(var each in update){
                    if(each !== '_deleted'){
                        var key = keyGen(update, each);
                        this.deleteTransition(key);
                    }
                }
                var key = rowKeyGen(update);
                this.deleteTransition(key);
                delete sdata[index];
                setTimeout(
                    function(callback){
                        callback();
                    }.bind(null, this.reset), 600);
            }
            else{
                if(!got){
                    sdata.push(update);
                    this.reset();
                    for(var each in update){
                        var key = keyGen(update, each);
                        this.newTransition(key);
                    }
                    var key = rowKeyGen(update);
                    this.newTransition(key);
                }
                else{
                    this.reset();
                    for(var each in update){
                        var key = keyGen(update, each);
                        this.updateTransition(key);
                    }
                    var key = rowKeyGen(update);
                    this.updateTransition(key);
                }
            }
        }.bind(this));
    },
    getStreamingTypes: function(){
        feed.getTypes( function(update){    // only called on change.
            this.setState({types: update});
        }.bind(this));
    },
    removeType: function(typeName) {
        feed.deleteData(typeName, function() {
            this.resetData();
        }.bind(this));
    },
    componentDidMount: function(){
        this.getStreamingTypes();
        setInterval(this.getStreamingTypes, 5*60*1000);  // call every 5 min.
    },
    watchStock: function(typeName){
        subsetESTypes.push(typeName);
        this.getStreamingData(typeName);
        console.log("selections: ", subsetESTypes);
    },
    unwatchStock: function(typeName){
        subsetESTypes.splice(subsetESTypes.indexOf(typeName), 1);
        this.removeType(typeName);
        this.getStreamingData(null);
        console.log("selections: ", subsetESTypes);
    },
    handleScroll: function(event){
        elem = document.body;
        elemElem = document.documentElement;
        var scroll = elemElem.clientHeight;
            windowHeight = elem.scrollHeight;
            scrollLeft = elem.scrollTop;
        if(windowHeight === scroll+scrollLeft){
            console.log('bottom');
            // Load more data !!
        }
    },
    render: function () {
        return (
            <div>
                <div id='modal' />
                <TypeTable className="dejavu-table" Types={this.state.types} watchTypeHandler={this.watchStock} unwatchTypeHandler={this.unwatchStock} />
                <DataTable _data={this.state.documents} scrollFunction={this.handleScroll}/>
            </div>
        );
    }
});