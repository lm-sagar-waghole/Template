import React, { useState, useEffect } from 'react';
import './FlightBoard.css';
import { cityTranslations } from './citytranslations';
import { translations } from './translations';
import { airlineLogoMap } from './AirlineLogo';
const languageOrder = ['en', 'hi', 'mr'];


export default function FlightBoard() {
    const [flightData, setFlightData] = useState([]);
    const [boardType, setBoardType] = useState('departure'); // 'arrival' or 'departure'
    const [boardVariant, setBoardVariant] = useState('domestic'); // 'domestic' or 'international'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    const [langIndex, setLangIndex] = useState(0);
    const [switchInterval, setSwitchInterval] = useState(100000); // 10 seconds default

    // 1. Parse URL Parameters (?type=arrival|departure & ?variant=domestic|international & ?interval=10000 & ?lang=en|hi|mr)
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);

        const typeParam = searchParams.get('type');
        if (typeParam === 'departure' || typeParam === 'arrival') {
            setBoardType(typeParam);
        } else {
            setBoardType('departure');
        }

        const variantParam = searchParams.get('variant');
        if (variantParam === 'domestic' || variantParam === 'international') {
            setBoardVariant(variantParam);
        } else {
            setBoardVariant('domestic');
        }

        const intervalParam = searchParams.get('interval');
        if (intervalParam && !isNaN(intervalParam)) {
            setSwitchInterval(Number(intervalParam));
        }

        const langParam = searchParams.get('lang');
        if (langParam && languageOrder.includes(langParam)) {
            setLangIndex(languageOrder.indexOf(langParam));
        }
    }, []);

    // 2. Cycle languages (EN -> HI -> MR)
    useEffect(() => {
        const langTimer = setInterval(() => {
            setLangIndex((prevIndex) => (prevIndex + 1) % languageOrder.length);
        }, switchInterval);

        return () => clearInterval(langTimer);
    }, [switchInterval]);

    // 3. Fetch flight data based on board type and variant
    useEffect(() => {
        const preferredFileName = `/fids_${boardVariant}_${boardType}.json`;

        setLoading(true);
        setError(null);

        fetch(preferredFileName)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to load ${preferredFileName}`);
                }
                return response.json();
            })
            .then((data) => {
                setFlightData(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [boardType, boardVariant]);

    // 4. Real-time Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 10000);
        return () => clearInterval(timer);
    }, []);

    const currentLang = languageOrder[langIndex];
    const t = translations[currentLang];
    const boardTitle = boardType === 'departure'
        ? (boardVariant === 'domestic' ? t.domesticDepartureTitle : t.internationalDepartureTitle)
        : (boardVariant === 'domestic' ? t.domesticArrivalTitle : t.internationalArrivalTitle);

    const localeMap = { en: 'en-GB', hi: 'hi-IN', mr: 'mr-IN' };
    const formattedDate = currentTime.toLocaleDateString(localeMap[currentLang], {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }) + ' ' + currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const translateCityName = (cityName) => {
        if (!cityName) return '-';
        return cityTranslations[currentLang]?.[cityName] ?? '';
    };

    const getStatusText = (status, eta) => {
        switch (status) {
            case 'Delayed':
                return t.status.delayed(eta);
            case 'Early':
                return t.status.early(eta);
            case 'Boarding':
                return t.status.boarding;
            case 'Gate Open':
                return t.status.gateOpen;
            case 'Gate Closed':
                return t.status.gateClosed;
            default:
                return t.status.onTime;
        }
    };



    const getAirlineLogoSrc = (flight) => {
        if (!flight) return null;
        const match = flight.trim().match(/^([A-Z0-9]{2,3})/i);
        if (!match) return null;
        const code = match[1].toLowerCase();
        const logoFile = airlineLogoMap[code];
        return logoFile ? `/img/${logoFile}` : null;
    };

    const renderAirlineBadge = (airline, flight) => {
        const logoSrc = getAirlineLogoSrc(flight);
        if (logoSrc) {
            return (
                <div className="airline-logo-cell">
                    <img className="airline-logo" src={logoSrc} alt={`${airline} logo`} />
                    <span className="airline-name">{airline}</span>
                </div>
            );
        }

        if (airline === "IndiGo" || (flight && flight.startsWith("6E"))) {
            return <span className="badge badge-indigo">IndiGo</span>;
        }
        if (airline === "Spicejet" || (flight && flight.startsWith("SG"))) {
            return <span className="badge badge-spicejet">SpiceJet</span>;
        }
        if (airline === "Emirates" || (flight && flight.startsWith("EK"))) {
            return <span className="badge badge-emirates">Emirates</span>;
        }
        if (airline === "Akasa Air" || (flight && flight.startsWith("QP"))) {
            return <span className="badge badge-akasa">Akasa Air</span>;
        }
        return <span className="badge badge-default">{airline}</span>;
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'On Time':
                return 'status-on-time';
            case 'Early':
            case 'Boarding':
                return 'status-early';
            case 'Delayed':
                return 'status-delayed';
            default:
                return '';
        }
    };

    const displayRows = Array.from({ length: 25 }, (_, index) => flightData[index]);

    return (
        <div className="flight-board-container">
            <div className="metal-frame">


                <div className="display-screen">
                    {/* Dynamic Board Title */}
                    <div className="screen-header">
                        <h1 className="screen-title">{boardTitle}</h1>
                    </div>

                    {/* Dynamic Table Headers */}
                    <div className="flight-grid table-header">
                        <div>{t.headers.airline}</div>
                        <div>{t.headers.flight}</div>
                        <div>{t.headers.time}</div>
                        <div>
                            {boardType === 'departure'
                                ? t.headers.locationDeparture
                                : t.headers.locationArrival}
                        </div>
                        <div>{t.headers.gate}</div>
                        <div>{t.headers.status}</div>
                    </div>

                    {/* Flight Data List */}
                    <div className="flight-list">
                        {loading && (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#bfdbfe' }}>
                                Loading flight data...
                            </div>
                        )}

                        {error && (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#facc15' }}>
                                Error: {error}
                            </div>
                        )}

                        {!loading && !error && displayRows.map((item, index) => (
                            <div
                                key={item ? `${item.Flight}-${index}` : `empty-${index}`}
                                className={`flight-grid flight-row ${index % 2 === 0 ? 'even' : 'odd'}${!item ? ' empty-row' : ''}`}
                            >
                                {item ? (
                                    <>
                                        <div>{renderAirlineBadge(item.Airline, item.Flight)}</div>
                                        <div className="flight-code">{item.Flight}</div>
                                        <div className="flight-time">{item.Time}</div>
                                        <div className="flight-origin">
                                            {translateCityName(boardType === 'departure' ? item.Destination : item.Origin)}
                                        </div>
                                        <div className="flight-gate">{item.Gate}</div>
                                        <div className={getStatusClass(item.Status)}>
                                            {getStatusText(item.Status, item.ETA)}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="empty-cell" />
                                        <div className="empty-cell" />
                                        <div className="empty-cell" />
                                        <div className="empty-cell" />
                                        <div className="empty-cell" />
                                        <div className="empty-cell" />
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Footer Bar */}
                    <div className="screen-footer">
                        <div className="live-indicator">
                        </div>
                        <div className="footer-clock">{formattedDate}</div>
                    </div>
                </div>

            </div>
        </div>
    );
}