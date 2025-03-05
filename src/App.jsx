import { useState, useEffect } from "react";
import { Layout, Card, Typography, Statistic, Spin, Row, Col } from "antd";
import axios from "axios";
import { Line } from "@ant-design/charts";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

const App = () => {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [city] = useState("Chittoor");
    const [temperatureData, setTemperatureData] = useState([]);
    const [windSpeedData, setWindSpeedData] = useState([]);  // State for wind speed data
    const [weeklyData, setWeeklyData] = useState([]);
    const [components, setComponents] = useState(() => {
        const savedComponents = localStorage.getItem("components");
        return savedComponents
            ? JSON.parse(savedComponents)
            : [
                { id: "temperature", type: "card", title: "Temperature", content: "Temperature" },
                { id: "description", type: "card", title: "Weather Description", content: "Description" },
                { id: "humidity", type: "card", title: "Humidity", content: "Humidity" },
                { id: "wind", type: "card", title: "Wind Speed", content: "Wind Speed" },
                { id: "sunrise_sunset", type: "card", title: "Sunrise & Sunset", content: "Sunrise/Sunset" },
                { id: "graph", type: "graph", title: "Temperature Trend" },
                { id: "wind_speed_graph", type: "graph", title: "Wind Speed Trend" },
                { id: "weekly_forecast", type: "graph", title: "Weekly Forecast" },
            ];
    });

    useEffect(() => {
        const fetchWeatherData = async () => {
            try {
                // Fetch current weather data
                const currentWeatherResponse = await axios.get(
                    `https://api.openweathermap.org/data/2.5/weather?q=Chittoor&units=metric&appid=ffbe4cce9a45f53595e4095f2da8f71c`
                );
                setWeather(currentWeatherResponse.data);

                // Fetch temperature history (mocked here for simplicity)
                const tempHistory = [
                    { time: "11 AM", temp: 22 },
                    { time: "3 AM", temp: 21 },
                    { time: "6 AM", temp: 20 },
                    { time: "9 AM", temp: 22 },
                    { time: "12 PM", temp: 24 },
                    { time: "3 PM", temp: 26 },
                ];
                setTemperatureData(tempHistory);

                // Fetch 5-day forecast data
                const forecastResponse = await axios.get(
                    `https://api.openweathermap.org/data/2.5/forecast?q=Chittoor&units=metric&appid=ffbe4cce9a45f53595e4095f2da8f71c`
                );

                // Log the raw API response to inspect the data
                console.log("Forecast API Response:", forecastResponse.data);

                // Process wind speed data (for hourly forecast)
                const windSpeedHistory = forecastResponse.data.list.map((entry) => ({
                    time: new Date(entry.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    windSpeed: entry.wind.speed,  // Wind speed in m/s
                }));

                // Log the processed wind speed data
                console.log("Processed Wind Speed Data:", windSpeedHistory);

                setWindSpeedData(windSpeedHistory);

                const processedWeeklyData = forecastResponse.data.list
                    .filter((entry) => entry.dt_txt.includes("12:00:00")) // Midday forecasts
                    .map((entry) => ({
                        day: new Date(entry.dt * 1000).toLocaleDateString("en-US", { weekday: "long" }),
                        temperature: entry.main.temp,
                    }));
                setWeeklyData(processedWeeklyData);

                setLoading(false);
            } catch (error) {
                setLoading(false);
                alert("Failed to fetch weather data.");
            }
        };

        fetchWeatherData();
    }, [city]);

    useEffect(() => {
        // Save components state to local storage
        localStorage.setItem("components", JSON.stringify(components));
    }, [components]);

    const handleOnDragEnd = (result) => {
        if (!result.destination) return;
        const reorderedComponents = Array.from(components);
        const [reorderedItem] = reorderedComponents.splice(result.source.index, 1);
        reorderedComponents.splice(result.destination.index, 0, reorderedItem);
        setComponents(reorderedComponents);
    };

    const chartConfig = {
        data: temperatureData,
        xField: "time",
        yField: "temp",
        seriesField: "time",
        label: { style: { fill: "#aaa" } },
        point: { size: 5, shape: "diamond" },
        smooth: true,
        color: "#3f8600",
        autoFit: true,
    };

    const windSpeedChartConfig = {
        data: windSpeedData,
        xField: "time",
        yField: "windSpeed",
        seriesField: "time",
        label: { style: { fill: "#aaa" } },
        point: { size: 5, shape: "diamond" },
        smooth: true,
        color: "#1890ff",
        autoFit: true,
    };

    const weeklyForecastConfig = {
        data: weeklyData,
        xField: "day",
        yField: "temperature",
        seriesField: "day",
        label: { style: { fill: "#aaa" } },
        point: { size: 5, shape: "circle" },
        smooth: true,
        color: "#fa8c16",
        autoFit: true,
    };

    return (
        <Layout style={{ minHeight: "100vh", background: "#e6f7ff" }}>
            <Header style={{ background: "#001529", padding: "0", position: "fixed", width: "100%", zIndex: 1 }}>
                <Title style={{ color: "white", textAlign: "center", padding: "16px 0", margin: 0 }} level={3}>
                    Weather Dashboard
                </Title>
            </Header>

            <Layout style={{ marginTop: "64px" }}>
                <Layout>
                    <Content style={{ padding: 24, margin: 0, minHeight: 280, background: "#d9f7be" }}>
                        {loading ? (
                            <Spin size="large" />
                        ) : (
                            <DragDropContext onDragEnd={handleOnDragEnd}>
                                <Droppable droppableId="components" direction="vertical">
                                    {(provided) => (
                                        <Row
                                            gutter={[16, 16]}
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            style={{ display: "flex", flexWrap: "wrap" }}
                                        >
                                            {components.map((component, index) => (
                                                <Draggable key={component.id} draggableId={component.id} index={index}>
                                                    {(provided) => (
                                                        <Col
                                                            xs={24}
                                                            sm={12}
                                                            md={8}
                                                            lg={6}
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                        >
                                                            {component.type === "card" ? (
                                                                <Card
                                                                    title={component.title}
                                                                    style={{
                                                                        background: "#ffffff",
                                                                        marginBottom: "16px",
                                                                    }}
                                                                >
                                                                    <Statistic
                                                                        title={component.content}
                                                                        value={
                                                                            component.id === "temperature"
                                                                                ? weather?.main?.temp
                                                                                : component.id === "description"
                                                                                ? weather?.weather[0]?.description
                                                                                : component.id === "humidity"
                                                                                ? weather?.main?.humidity
                                                                                : component.id === "wind"
                                                                                ? weather?.wind?.speed
                                                                                : component.id === "sunrise_sunset"
                                                                                ? `Sunrise: ${new Date(
                                                                                    weather?.sys?.sunrise * 1000
                                                                                ).toLocaleTimeString()} / Sunset: ${new Date(
                                                                                    weather?.sys?.sunset * 1000
                                                                                ).toLocaleTimeString()}`
                                                                                : "N/A"
                                                                        }
                                                                    />
                                                                </Card>
                                                            ) : (
                                                                <Card title={component.title} bordered={false}>
                                                                    <div style={{ height: "300px", width: "300px" }}>
                                                                        {component.id === "graph" ? (
                                                                            <Line {...chartConfig} />
                                                                        ) : component.id === "wind_speed_graph" ? (
                                                                            <Line {...windSpeedChartConfig} />
                                                                        ) : (
                                                                            <Line {...weeklyForecastConfig} />
                                                                        )}
                                                                    </div>
                                                                </Card>
                                                            )}
                                                        </Col>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </Row>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        )}
                    </Content>
                </Layout>
            </Layout>

            <Footer style={{ textAlign: "center", background: "#e6f7ff" }}>
                Weather Dashboard ©2024 Created by You
            </Footer>
        </Layout>
    );
};

export default App;
