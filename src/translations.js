export const translations = {
    en: {
        domesticArrivalTitle: "Domestic Arrivals",
        internationalArrivalTitle: "International Arrivals",
        domesticDepartureTitle: "Domestic Departures",
        internationalDepartureTitle: "International Departures",
        headers: {
            airline: "Airline",
            flight: "Flight",
            time: "Time",
            locationArrival: "Origin",
            locationDeparture: "Destination",
            gate: "Gate",
            status: "Status"
        },
        status: {
            onTime: "On Time",
            early: (eta) => `Landed ${eta}`,
            delayed: (eta) => (eta ? `Now at ${eta}` : "Delayed"),
            boarding: "Boarding",
            gateOpen: "Gate Open",
            gateClosed: "Gate Closed"
        },
        live: "LIVE DISPLAY"
    },
    hi: {
        domesticArrivalTitle: "अंतर्देशीय आगमन",
        internationalArrivalTitle: "अंतर्राष्ट्रीय आगमन",
        domesticDepartureTitle: "अंतर्देशीय प्रस्थान",
        internationalDepartureTitle: "अंतर्राष्ट्रीय प्रस्थान",
        headers: {
            airline: "एयरलाइन",
            flight: "उड़ान",
            time: "समय",
            locationArrival: "प्रस्थान",
            locationDeparture: "गंतव्य स्थान",
            gate: "द्वार",
            status: "स्थिति"
        },
        status: {
            onTime: "समय पर",
            early: (eta) => `पहुंची ${eta}`,
            delayed: (eta) => (eta ? `आता ${eta}` : "आता"),
            boarding: "बोर्डिंग चालू",
            gateOpen: "द्वार खुला",
            gateClosed: "द्वार बंद"
        },
        live: "लाइव प्रदर्शन"
    },
    mr: {
        domesticArrivalTitle: "अंतर्देशीय आगमन",
        internationalArrivalTitle: "आंतरराष्ट्रीय आगमन",
        domesticDepartureTitle: "अंतर्देशीय प्रस्थान",
        internationalDepartureTitle: "आंतरराष्ट्रीय प्रस्थान",
        headers: {
            airline: "एयरलाइन",
            flight: "उड्डाण",
            time: "वेळ",
            locationArrival: "मूळ स्थान",
            locationDeparture: "गंतव्य स्थान",
            gate: "द्वार",
            status: "स्थिती"
        },
        status: {
            onTime: "वेळे वर",
            early: (eta) => `आली ${eta}`,
            delayed: (eta) => (eta ? `आता ${eta}` : "आता"),
            boarding: "बोर्डिंग सुरू",
            gateOpen: "द्वार उघडले",
            gateClosed: "द्वार बंद"
        },
        live: "थेट प्रदर्शन"
    }
};