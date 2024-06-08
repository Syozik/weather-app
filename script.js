const key = "93daeb1a873444e8937213107240506";
const properties = ["maxtemp_c", "maxtemp_f", "mintemp_c", "mintemp_f", "avgtemp_c", "daily_chance_of_rain", "avghumidity", "condition"]

function formatDate(date){
    let year = date.getFullYear();
    let month = ''+(date.getMonth()+1);
    let day = ''+date.getDate();
    month = month.length < 2 ? '0'+month : month;
    day = day.length < 2 ? '0'+day : day;
    
    return [year, month, day].join('-');
}


class WeatherApp{
    constructor(location, days=7, measure="c"){
        this.location = location;
        this.days = days;
        this.measure = measure;
    }

    getWeatherAPI(){
        return new Promise((resolve) => {
            fetch(`http://api.weatherapi.com/v1/forecast.json?key=${key}&q=${this.location}&days=${this.days}`, {mode:"cors"})
                .then((result) =>{
                    return result.json();
            })
                .then(function(data){
                    resolve(data);
            });
        })
    }

    async getWeatherData(){
        if (this.weatherForecast == undefined){
            this.weatherForecast = await this.getWeatherAPI();
            // console.log("Debugging: async");
            return this.weatherForecast;
        }
        return this.weatherForecast;
    }

    changeMeasure(){
        this.measure = this.measure == "c" ? "f" : "c";
    }


    async getData(day){
        let weatherData = await this.getWeatherData();
        day = formatDate(day);
        let data = weatherData["forecast"]["forecastday"]
        .filter(data => data["date"] == day)[0];
        let result = {"day":day};
        result["wind"] = this.getWindSpeed(data["hour"],day);
        data = data["day"];
        let propertiesChecked = Object.keys(data).filter(property => properties.includes(String(property)));
        for (let property of propertiesChecked){
            if (property.slice(property.length - 2, property.length) != "_c" && property.slice(property.length - 2, property.length) != "_f"){
                result[property] = data[property];
            }else if(property[property.length -1] == this.measure){
                result[property.slice(0, property.length-2)] = data[property];
            }
        }
        
        return result;
    }

    getWindSpeed(data, day){
        let wind = this.measure? "wind_kph" : "wind_mph";
        let windSpeed = 0;
        let [start, finish] = [6, 22];
        for (let i=start; i<=finish; i++){
            windSpeed += data[i][wind];
        }
        windSpeed /= (finish - start + 1);
        return windSpeed;
    }
}

class DOMChanger{
    static appendDayWeather(weatherData){
        console.log(weatherData);
        let nextWeekField = document.querySelector(".weatherNextWeek");
        let newField = document.createElement("div");
        let background_url = weatherData["condition"]["icon"];
        newField.style.cssText += `background: url(https:${background_url}) no-repeat, linear-gradient(0deg, rgba(56,104,120,1) 0%, rgba(20,38,33,1) 100%);`;
        let newDay = parseInt(weatherData.day.slice(weatherData.day.length-2,));
        let date = new Date(weatherData.day);
        let month = date.toLocaleString('default', {month: "short"});
        
        let dayTitle = document.createElement("h4");
        dayTitle.innerHTML = `${month} ${newDay}`;
        dayTitle.style.cssText = "grid-column:1/-1; text-align: center";
        let maxTemp = document.createElement("div");
        maxTemp.innerHTML = "Max";
        let maxTempValue = document.createElement("div");
        maxTempValue.innerHTML = weatherData.maxtemp+"°";
        maxTemp.appendChild(maxTempValue);
        
        let minTemp = document.createElement("div");
        minTemp.innerHTML = "Min";
        let minTempValue = document.createElement("div");
        minTempValue.innerHTML = weatherData.mintemp+'°';
        minTemp.appendChild(minTempValue);
        
        let avgTemp = document.createElement("div");
        avgTemp.innerHTML = "Avg";
        let avgTempValue = document.createElement("div");
        avgTempValue.innerHTML = weatherData.avgtemp + "°";
        avgTemp.appendChild(avgTempValue);
        
        let avghumidity = document.createElement("div");
        avghumidity.innerHTML = "Humidity";
        let avghumidityValue = document.createElement("div");
        avghumidityValue.innerHTML = weatherData.maxtemp;
        avghumidity.appendChild(avghumidityValue);
        
        let rain = document.createElement("div");
        rain.innerHTML = "Rain";
        let rainValue = document.createElement("div");
        rainValue.innerHTML = weatherData.maxtemp + "%";
        rain.appendChild(rainValue);
        
        let wind = document.createElement("div");
        wind.innerHTML = "Wind";
        let windValue = document.createElement("div");
        windValue.innerHTML = Math.round(weatherData.wind);
        wind.appendChild(windValue);

        for (let child of [dayTitle, maxTemp, avgTemp, minTemp, avghumidity, rain, wind]){
            newField.appendChild(child);
        }

        nextWeekField.appendChild(newField);
    }
}

function addDays(date, days) {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days+1);
    return newDate;
}

class Main{
    static async updateLocation(){
        let input = document.querySelector("#location").value;
        let nextWeakField = document.querySelector(".weatherNextWeek")
        nextWeakField.innerHTML = "";
        let locationText = document.querySelector("#city");
        let location = new WeatherApp(input, 8);
        let data = await location.getWeatherData()
        locationText.innerHTML = "Weather Forecast for " + input;
        console.log(data);
        let today = data["location"]["localtime"].split(" ")[0];
        for (let i=1;i<8;i++){
            DOMChanger.appendDayWeather(await location.getData(addDays(today, i)));
        }
        
        
    }
}
