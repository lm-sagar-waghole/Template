import React, { useState, useEffect } from "react";
import "./FlightBoard.css";
import { translations } from "./translations";
import { airlineLogoMap } from "./AirlineLogo";
import {
  getCachedCityTranslation,
  getStaticCityTranslation,
  translateCityWithCache,
} from "./cityTranslationService";
const languageOrder = ["en", "hi", "mr"];
const ROWS_PER_PAGE = 25;
const DATA_PAGE_INTERVAL = 15 * 1000;
import gateTranslate from "../public/gateTranslate.json";

export default function FlightBoard() {
  const [flightData, setFlightData] = useState([]);
  const [boardType, setBoardType] = useState("departure"); // 'arrival' or 'departure'
  const [boardVariant, setBoardVariant] = useState("domestic"); // 'domestic' or 'international'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [langIndex, setLangIndex] = useState(0);
  const [switchInterval, setSwitchInterval] = useState(10 * 1000); // 10 seconds default
  const [translatedCities, setTranslatedCities] = useState({});
  const [dataPage, setDataPage] = useState(0);

  // 1. Parse URL Parameters (?type=arrival|departure & ?variant=domestic|international & ?interval=10000 & ?lang=en|hi|mr)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    const typeParam = searchParams.get("type");
    if (typeParam === "departure" || typeParam === "arrival") {
      setBoardType(typeParam);
    } else {
      setBoardType("departure");
    }

    const variantParam = searchParams.get("variant");
    if (variantParam === "domestic" || variantParam === "international") {
      setBoardVariant(variantParam);
    } else {
      setBoardVariant("domestic");
    }

    const intervalParam = searchParams.get("interval");
    if (intervalParam && !isNaN(intervalParam)) {
      setSwitchInterval(Number(intervalParam));
    }

    // const langParam = searchParams.get("lang");
    // if (langParam === "mr" || langParam === "en" || langParam === "hi") {
    //   if (langParam && languageOrder.includes(langParam)) {
    //     setLangIndex(languageOrder.indexOf(langParam));
    //   }
    // } else {
    //   const langTimer = setInterval(() => {
    //     setLangIndex((prevIndex) => (prevIndex + 1) % languageOrder.length);
    //   }, switchInterval);
    //   return () => clearInterval(langTimer);
    // }

    const langParam = searchParams.get("lang");

    if (languageOrder.includes(langParam)) {
      setLangIndex(languageOrder.indexOf(langParam));
    }
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    const langParam = searchParams.get("lang");

    // If lang is provided, don't auto-switch
    if (languageOrder.includes(langParam)) {
      return;
    }

    const langTimer = setInterval(() => {
      setLangIndex((prevIndex) => {
        return (prevIndex + 1) % languageOrder.length;
      });
    }, switchInterval);

    return () => clearInterval(langTimer);
  }, [switchInterval]);

  // 2. Cycle languages (EN -> HI -> MR)
  // useEffect(() => {
  //   const langTimer = setInterval(() => {
  //     setLangIndex((prevIndex) => (prevIndex + 1) % languageOrder.length);
  //   }, switchInterval);

  //   return () => clearInterval(langTimer);
  // }, []);

  // 3. Fetch flight data based on board type and variant
  useEffect(() => {
    const preferredFileName = `${import.meta.env.BASE_URL}fids_${boardVariant}_${boardType}.json`;

    setLoading(true);
    setError(null);
    setDataPage(0);

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

  useEffect(() => {
    if (flightData.length <= ROWS_PER_PAGE) {
      setDataPage(0);
      return undefined;
    }

    const pageCount = Math.ceil(flightData.length / ROWS_PER_PAGE);
    const pageTimer = setInterval(() => {
      setDataPage((currentPage) => (currentPage + 1) % pageCount);
    }, DATA_PAGE_INTERVAL);

    return () => clearInterval(pageTimer);
  }, [flightData]);

  // 4. Real-time Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const currentLang = languageOrder[langIndex];
  const t = translations[currentLang];
  const boardTitle =
    boardType === "departure"
      ? boardVariant === "domestic"
        ? t.domesticDepartureTitle
        : t.internationalDepartureTitle
      : boardVariant === "domestic"
        ? t.domesticArrivalTitle
        : t.internationalArrivalTitle;

  const localeMap = { en: "en-GB", hi: "hi-IN", mr: "mr-IN" };
  const formattedDate =
    currentTime.toLocaleDateString(localeMap[currentLang], {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }) +
    " " +
    currentTime.toLocaleTimeString(localeMap[currentLang], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const translateCityName = (cityName) => {
    if (!cityName) return "-";

    return (
      getStaticCityTranslation(cityName, currentLang) ||
      getCachedCityTranslation(cityName, currentLang) ||
      translatedCities[`${currentLang}:${cityName}`] ||
      cityName
    );
  };

  useEffect(() => {
    const cityNames = flightData
      .map((item) =>
        boardType === "departure" ? item.Destination : item.Origin,
      )
      .filter(Boolean);

    const missingCities = [...new Set(cityNames)].filter(
      (cityName) =>
        !getStaticCityTranslation(cityName, currentLang) &&
        !getCachedCityTranslation(cityName, currentLang),
    );

    if (missingCities.length === 0) return undefined;

    let isActive = true;
    Promise.all(
      missingCities.map(async (cityName) => [
        `${currentLang}:${cityName}`,
        await translateCityWithCache(cityName, currentLang),
      ]),
    ).then((results) => {
      if (isActive) {
        setTranslatedCities((previous) => ({
          ...previous,
          ...Object.fromEntries(results),
        }));
      }
    });

    return () => {
      isActive = false;
    };
  }, [boardType, currentLang, flightData]);

  const displayValue = (value) => value || "-";

  const getStatusText = (status, eta) => {
    switch (status) {
      case "On Time":
        return t.status.onTime;
      case "Delayed":
        return t.status.delayed(eta);
      case "Early":
        return t.status.early(eta);
      case "Boarding":
        return t.status.boarding;
      case "Gate Open":
        return t.status.gateOpen;
      case "Gate Closed":
        return t.status.gateClosed;
      case "Check-in Open":
        return t.status.checkInOpen;
      case "Check-in Closed":
        return t.status.checkInClosed;
      case "Final Call":
        return t.status.finalCall;
      case "Security Check":
        return t.status.securityCheck;
      case "Departed":
        return t.status.departed;
      case "Cancel":
        return t.status.cancel;
      default:
        return displayValue(status);
    }
  };

  const getAirlineLogoSrc = (flight) => {
    if (!flight) return null;
    const match = flight.trim().match(/^([A-Z0-9]{2,3})/i);
    if (!match) return null;
    const code = match[0].toLowerCase();
    const logoFile = airlineLogoMap[code[0] + code[1]] || airlineLogoMap[code];
    return logoFile ? `${import.meta.env.BASE_URL}img/${logoFile}` : null;
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
      case "onTime":
        return "status-on-time";
      case "Early":
      case "Boarding":
        return "status-early";
      case "Delayed":
        return "status-delayed";
      case "Check-in Closed":
      case "Gate Closed":
        return "status-delayed";
      case "Final Call":
        return "status-final-call";
      case "Security Check":
      case "Check-in Open":
      case "Gate Open":
        return "status-early";
      case "Departed":
        return "status-departed";
      default:
        return "status-default";
    }
  };

  const pageStart = dataPage * ROWS_PER_PAGE;
  const displayRows = Array.from(
    { length: ROWS_PER_PAGE },
    (_, index) => flightData[pageStart + index],
  );

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
              {boardType === "departure"
                ? t.headers.locationDeparture
                : t.headers.locationArrival}
            </div>
            <div>
              {boardType === "departure" ? t.headers.gate : t.headers.eta}
            </div>
            <div>{t.headers.status}</div>
            <div>{t.headers.extraInfo}</div>
          </div>

          {/* Flight Data List */}
          <div className="flight-list">
            {loading && (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: "#bfdbfe",
                }}
              >
                Loading flight data...
              </div>
            )}

            {error && (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: "#facc15",
                }}
              >
                Error: {error}
              </div>
            )}

            {!loading &&
              !error &&
              displayRows.map((item, index) => (
                <div
                  key={item ? `${item.Flight}-${index}` : `empty-${index}`}
                  className={`flight-grid flight-row ${index % 2 === 0 ? "even" : "odd"}${!item ? " empty-row" : ""}`}
                >
                  {item ? (
                    <>
                      {renderAirlineBadge(
                        displayValue(item.Airline || item["Airline Name"]),
                        item.Flight,
                      )}
                      <div
                        className="flight-code"
                        data-label={t.headers.flight}
                      >
                        {displayValue(item.Flight)}
                      </div>
                      <div className="flight-time" data-label={t.headers.time}>
                        {displayValue(
                          item.Time ? item.Time.split(" ").pop() : "",
                        )}
                      </div>
                      <div
                        className={`flight-origin-scroll${
                          translateCityName(
                            boardType === "departure"
                              ? item.Destination
                              : item.Origin,
                          ).length > 16
                            ? " is-long"
                            : ""
                        }`}
                      >
                        <span className="flight-field-label">
                          {boardType === "departure"
                            ? t.headers.locationDeparture
                            : t.headers.locationArrival}
                        </span>
                        <span className="flight-origin-text">
                          {translateCityName(
                            boardType === "departure"
                              ? item.Destination
                              : item.Origin,
                          )}
                        </span>
                      </div>

                      {(() => {
                        const gateOrEta = displayValue(
                          boardType === "departure" ? item.Gate : item.ETA,
                        );
                        const displayedValue =
                          gateTranslate[gateOrEta] ||
                          item.Gate ||
                          item.ETA ||
                          "-";
                        return (
                          <div
                            className={`flight-origin-scroll${
                              displayedValue.length > 5 ? " is-long" : ""
                            }`}
                            data-label={
                              boardType === "departure"
                                ? t.headers.gate
                                : t.headers.eta
                            }
                          >
                            <span className="flight-origin-text">
                              {displayedValue}
                            </span>
                          </div>
                        );
                      })()}

                      {/* <div
                        className="flight-gate"
                        data-label={
                          boardType === "departure"
                            ? t.headers.gate
                            : t.headers.eta
                        }
                      >
                        {displayValue(
                          boardType === "departure" ? item.Gate : item.ETA,
                        )}
                      </div> */}

                      {/* <div
                        className={getStatusClass(item.Status)}
                        data-label={t.headers.status}
                      >
                        {getStatusText(item.Status, item.ETA)}
                      </div> */}

                      <div
                        className={`flight-origin-scroll${
                          displayValue(item.Status).length > 14
                            ? " is-long"
                            : ""
                        }`}
                      >
                        <span className="flight-field-label">
                          {t.headers.status}
                        </span>
                        <span className="flight-origin-text">
                          {getStatusText(item.Status, item.ETA)}
                        </span>
                      </div>

                      <div
                        className={`flight-origin-scroll${
                          displayValue(item.ExtraInfo).length > 16
                            ? " is-long"
                            : ""
                        }`}
                      >
                        <span className="flight-field-label">
                          {t.headers.extraInfo}
                        </span>
                        <span className="flight-origin-text">
                          {displayValue(item.ExtraInfo)}
                        </span>
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
            <div className="live-indicator"></div>
            <div className="footer-clock">{formattedDate}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
