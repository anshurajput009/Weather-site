const API_KEY = '8bc2f9d5ae85d87a5daa6cbdfb60092f'; // Replace with your API key
const DEMO_MODE = false; // Set to false when you have an API key

const demoWeatherData = {
    current: {
        name: "Patna", country: "IN", temp: 32, feels_like: 36, humidity: 65,
        pressure: 1013, visibility: 10, wind_speed: 12, wind_deg: 230, uv_index: 7,
        description: "Partly cloudy", icon: "☁️"
    },
    forecast: [
        { day: "Today", icon: "☁️", high: 32, low: 24, desc: "Partly cloudy" },
        { day: "Tomorrow", icon: "🌤️", high: 34, low: 26, desc: "Sunny intervals" },
        { day: "Thursday", icon: "🌧️", high: 28, low: 22, desc: "Light rain" },
        { day: "Friday", icon: "⛈️", high: 25, low: 20, desc: "Thunderstorms" },
        { day: "Saturday", icon: "☀️", high: 30, low: 23, desc: "Sunny" }
    ]
};

function getWeatherIcon(iconCode) {
    const iconMap = {
        '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️',
        '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
        '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
        '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️',
        '50d': '🌫️', '50n': '🌫️'
    };
    return iconMap[iconCode] || '🌤️';
}

async function fetchWeatherData(city) {
    try {
        if (DEMO_MODE) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return demoWeatherData;
        }

        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`;

        const [currentResponse, forecastResponse] = await Promise.all([
            fetch(currentWeatherUrl), fetch(forecastUrl)
        ]);

        if (!currentResponse.ok || !forecastResponse.ok) throw new Error('Weather data not found');

        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();

        return {
            current: {
                name: currentData.name, country: currentData.sys.country,
                temp: Math.round(currentData.main.temp),
                feels_like: Math.round(currentData.main.feels_like),
                humidity: currentData.main.humidity, pressure: currentData.main.pressure,
                visibility: Math.round(currentData.visibility / 1000),
                wind_speed: Math.round(currentData.wind.speed * 3.6),
                wind_deg: currentData.wind.deg,
                description: currentData.weather[0].description,
                icon: getWeatherIcon(currentData.weather[0].icon)
            },
            forecast: processForecastData(forecastData.list)
        };
    } catch (error) {
        throw new Error(`Failed to fetch weather data: ${error.message}`);
    }
}

function processForecastData(forecastList) {
    const dailyForecasts = {}, days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000), dayKey = date.toDateString();
        if (!dailyForecasts[dayKey]) dailyForecasts[dayKey] = {
            day: date.getDate() === new Date().getDate() ? 'Today' :
                 date.getDate() === new Date().getDate() + 1 ? 'Tomorrow' :
                 days[date.getDay()],
            temps: [], icons: [], descriptions: []
        };
        dailyForecasts[dayKey].temps.push(item.main.temp);
        dailyForecasts[dayKey].icons.push(getWeatherIcon(item.weather[0].icon));
        dailyForecasts[dayKey].descriptions.push(item.weather[0].description);
    });
    return Object.values(dailyForecasts).slice(0, 5).map(day => ({
        day: day.day, icon: day.icons[0],
        high: Math.round(Math.max(...day.temps)),
        low: Math.round(Math.min(...day.temps)), desc: day.descriptions[0]
    }));
}

function displayWeather(data) {
    const container = document.getElementById('weatherContainer'), current = data.current, forecast = data.forecast;
    container.innerHTML = `
        <div class="weather-card current-weather">
            <h1 class="city-name">${current.name}, ${current.country}</h1>
            <div class="current-date">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div class="weather-main"><div class="weather-icon">${current.icon}</div><div class="temperature">${current.temp}°C</div></div>
            <div class="weather-description">${current.description}</div>
            <div class="weather-details">
                <div class="detail-item"><div class="detail-label">Feels like</div><div class="detail-value">${current.feels_like}°C</div></div>
                <div class="detail-item"><div class="detail-label">Humidity</div><div class="detail-value">${current.humidity}%</div></div>
                <div class="detail-item"><div class="detail-label">Wind Speed</div><div class="detail-value">${current.wind_speed} km/h</div></div>
                <div class="detail-item"><div class="detail-label">Pressure</div><div class="detail-value">${current.pressure} hPa</div></div>
                <div class="detail-item"><div class="detail-label">Visibility</div><div class="detail-value">${current.visibility} km</div></div>
                <div class="detail-item"><div class="detail-label">UV Index</div><div class="detail-value">${current.uv_index || 'N/A'}</div></div>
            </div>
        </div>
        <div class="weather-card"><div class="section-title">5-Day Forecast</div>
            <div class="forecast-container">
            ${forecast.map(day => `<div class="forecast-item"><div class="forecast-day">${day.day}</div><div class="forecast-icon">${day.icon}</div><div class="forecast-temps"><span class="temp-high">${day.high}°</span><span class="temp-low">${day.low}°</span></div><div style="font-size:0.9em;opacity:0.8;margin-top:5px;">${day.desc}</div></div>`).join('')}
            </div></div>`;
}

function displayLoading() {
    document.getElementById('weatherContainer').innerHTML = `<div class="weather-card loading"><div>🌤️ Loading weather data...</div></div>`;
}

function displayError(message) {
    document.getElementById('weatherContainer').innerHTML = `<div class="error">❌ ${message}</div>`;
}

async function searchWeather() {
    const city = document.getElementById('cityInput').value.trim();
    if (!city) return displayError('Please enter a city name');
    displayLoading();
    try { displayWeather(await fetchWeatherData(city)); }
    catch (error) { displayError(error.message); }
}

function getCurrentLocation() {
    if (!navigator.geolocation) return displayError('Geolocation is not supported by this browser');
    displayLoading();
    navigator.geolocation.getCurrentPosition(
        () => fetchWeatherData('Patna').then(displayWeather).catch(err => displayError(err.message)),
        () => displayError('Unable to retrieve your location')
    );
}

document.getElementById('cityInput').addEventListener('keypress', e => { if (e.key === 'Enter') searchWeather(); });
window.addEventListener('load', () => fetchWeatherData('Patna').then(displayWeather).catch(error => displayError(error.message)));
