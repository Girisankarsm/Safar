/**
 * Minimal demo fallback — only used when VITE_DEMO_MODE=true.
 * Production must use live OSM + user-generated Supabase data.
 */
import type { CityId, SafeWaitingSpot } from "@/types/database";

export const DEMO_CITY_CENTERS: Record<CityId, { lat: number; lng: number; name: string }> = {
  chennai: { lat: 13.0827, lng: 80.2707, name: "Chennai" },
  trivandrum: { lat: 8.5241, lng: 76.9366, name: "Trivandrum" },
  bangalore: { lat: 12.9716, lng: 77.5946, name: "Bengaluru" },
  hyderabad: { lat: 17.385, lng: 78.4867, name: "Hyderabad" },
};

/** Demo-only geocode when Nominatim unavailable */
export const DEMO_GEOCODE: Record<CityId, Record<string, { lat: number; lng: number; name: string }>> = {
  chennai: {
    "t nagar": { lat: 13.0418, lng: 80.2341, name: "T Nagar" },
    "chennai central": { lat: 13.0827, lng: 80.2751, name: "Chennai Central" },
  },
  trivandrum: {
    technopark: { lat: 8.5241, lng: 76.9366, name: "Technopark" },
    palayam: { lat: 8.5099, lng: 76.9655, name: "Palayam" },
  },
  bangalore: {
    "mg road": { lat: 12.9756, lng: 77.6063, name: "MG Road" },
    indiranagar: { lat: 12.9784, lng: 77.6408, name: "Indiranagar" },
  },
  hyderabad: {
    hitech: { lat: 17.4435, lng: 78.3772, name: "HITEC City" },
    secunderabad: { lat: 17.4399, lng: 78.4983, name: "Secunderabad" },
  },
};

export type LocalPlaceSuggestion = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

/** Offline autocomplete fallback when Nominatim is unavailable.
 *  Used only when live search fails — Nominatim covers every OSM place. */
export const LOCAL_PLACE_SUGGESTIONS: Record<CityId, LocalPlaceSuggestion[]> = {
  chennai: [
    // Stations & Transit
    { id: "chen-central",     name: "Chennai Central Railway Station",   address: "Park Town, Chennai, Tamil Nadu",              lat: 13.0827, lng: 80.2751 },
    { id: "chen-egmore",      name: "Chennai Egmore Railway Station",     address: "Egmore, Chennai, Tamil Nadu",                 lat: 13.0732, lng: 80.2609 },
    { id: "chen-beach",       name: "Chennai Beach Railway Station",      address: "Fort St George, Chennai, Tamil Nadu",         lat: 13.0951, lng: 80.2882 },
    { id: "chen-tambaram",    name: "Tambaram Railway Station",           address: "Tambaram, Chennai, Tamil Nadu",               lat: 12.9249, lng: 80.1274 },
    { id: "chen-avadi",       name: "Avadi Railway Station",              address: "Avadi, Chennai, Tamil Nadu",                  lat: 13.1143, lng: 80.0975 },
    { id: "chen-ambattur",    name: "Ambattur Railway Station",           address: "Ambattur, Chennai, Tamil Nadu",               lat: 13.0982, lng: 80.1606 },
    { id: "chen-mambalam",    name: "Mambalam Railway Station",           address: "T Nagar, Chennai, Tamil Nadu",                lat: 13.0343, lng: 80.2225 },
    { id: "chen-airport",     name: "Chennai International Airport",      address: "Meenambakkam, Chennai, Tamil Nadu",           lat: 12.9941, lng: 80.1709 },
    { id: "chen-cmbt",        name: "CMBT Bus Terminal",                  address: "Koyambedu, Chennai, Tamil Nadu",              lat: 13.0697, lng: 80.2099 },
    // Metro Stations
    { id: "chen-koyambedu",   name: "Koyambedu Metro Station",           address: "Koyambedu, Chennai, Tamil Nadu",              lat: 13.0709, lng: 80.2084 },
    { id: "chen-anna-nagar-t",name: "Anna Nagar Tower Metro Station",     address: "Anna Nagar, Chennai, Tamil Nadu",             lat: 13.0862, lng: 80.2099 },
    { id: "chen-thirumangalam",name:"Thirumangalam Metro Station",         address: "Thirumangalam, Chennai, Tamil Nadu",          lat: 13.0844, lng: 80.2017 },
    { id: "chen-guindy-metro",name: "Guindy Metro Station",               address: "Guindy, Chennai, Tamil Nadu",                 lat: 13.0069, lng: 80.2153 },
    { id: "chen-alandur",     name: "Alandur Metro Station",              address: "Alandur, Chennai, Tamil Nadu",                lat: 12.9975, lng: 80.2029 },
    { id: "chen-stm-metro",   name: "St Thomas Mount Metro Station",      address: "St Thomas Mount, Chennai, Tamil Nadu",        lat: 13.0012, lng: 80.1956 },
    { id: "chen-mg-metro",    name: "MG Ramachandran Central Metro",      address: "Park Town, Chennai, Tamil Nadu",              lat: 13.0827, lng: 80.2751 },
    // Major Areas / Neighbourhoods
    { id: "t-nagar",          name: "T Nagar",                            address: "Thyagaraya Nagar, Chennai, Tamil Nadu",       lat: 13.0418, lng: 80.2341 },
    { id: "anna-nagar",       name: "Anna Nagar",                         address: "Anna Nagar, Chennai, Tamil Nadu",             lat: 13.0850, lng: 80.2101 },
    { id: "adyar",            name: "Adyar",                              address: "Adyar, Chennai, Tamil Nadu",                  lat: 13.0012, lng: 80.2565 },
    { id: "besant-nagar",     name: "Besant Nagar",                       address: "Besant Nagar, Chennai, Tamil Nadu",           lat: 12.9990, lng: 80.2677 },
    { id: "mylapore",         name: "Mylapore",                           address: "Mylapore, Chennai, Tamil Nadu",               lat: 13.0337, lng: 80.2677 },
    { id: "velachery",        name: "Velachery",                          address: "Velachery, Chennai, Tamil Nadu",              lat: 12.9815, lng: 80.2209 },
    { id: "omr",              name: "OMR IT Corridor",                    address: "Old Mahabalipuram Road, Chennai, Tamil Nadu", lat: 12.9496, lng: 80.2372 },
    { id: "sholinganallur",   name: "Sholinganallur",                     address: "Sholinganallur, Chennai, Tamil Nadu",         lat: 12.9010, lng: 80.2279 },
    { id: "porur",            name: "Porur",                              address: "Porur, Chennai, Tamil Nadu",                  lat: 13.0358, lng: 80.1573 },
    { id: "perambur",         name: "Perambur",                           address: "Perambur, Chennai, Tamil Nadu",               lat: 13.1126, lng: 80.2344 },
    { id: "tondiarpet",       name: "Tondiarpet",                         address: "Tondiarpet, Chennai, Tamil Nadu",             lat: 13.1164, lng: 80.2926 },
    { id: "kolathur",         name: "Kolathur",                           address: "Kolathur, Chennai, Tamil Nadu",               lat: 13.1148, lng: 80.2175 },
    { id: "nungambakkam",     name: "Nungambakkam",                       address: "Nungambakkam, Chennai, Tamil Nadu",           lat: 13.0569, lng: 80.2456 },
    { id: "royapettah",       name: "Royapettah",                         address: "Royapettah, Chennai, Tamil Nadu",             lat: 13.0497, lng: 80.2663 },
    { id: "kodambakkam",      name: "Kodambakkam",                        address: "Kodambakkam, Chennai, Tamil Nadu",            lat: 13.0511, lng: 80.2261 },
    { id: "vadapalani",       name: "Vadapalani",                         address: "Vadapalani, Chennai, Tamil Nadu",             lat: 13.0503, lng: 80.2121 },
    { id: "nanganallur",      name: "Nanganallur",                        address: "Nanganallur, Chennai, Tamil Nadu",            lat: 12.9877, lng: 80.1889 },
    { id: "pallikaranai",     name: "Pallikaranai",                       address: "Pallikaranai, Chennai, Tamil Nadu",           lat: 12.9378, lng: 80.2144 },
    { id: "madipakkam",       name: "Madipakkam",                         address: "Madipakkam, Chennai, Tamil Nadu",             lat: 12.9590, lng: 80.2030 },
    { id: "poonamallee",      name: "Poonamallee",                        address: "Poonamallee, Chennai, Tamil Nadu",            lat: 13.0471, lng: 80.1228 },
    { id: "perungudi",        name: "Perungudi",                          address: "Perungudi, Chennai, Tamil Nadu",              lat: 12.9603, lng: 80.2466 },
    // Colleges & Universities
    { id: "anna-uni",         name: "Anna University",                    address: "Guindy, Chennai, Tamil Nadu",                 lat: 13.0112, lng: 80.2335 },
    { id: "iit-madras",       name: "IIT Madras",                         address: "Sardar Patel Road, Chennai, Tamil Nadu",      lat: 12.9916, lng: 80.2336 },
    { id: "loyola",           name: "Loyola College",                     address: "Nungambakkam, Chennai, Tamil Nadu",           lat: 13.0655, lng: 80.2416 },
    { id: "mcc",              name: "Madras Christian College",           address: "East Tambaram, Chennai, Tamil Nadu",          lat: 12.9278, lng: 80.1241 },
    { id: "srm-ktr",          name: "SRM Institute of Science & Technology", address: "Kattankulathur, Chengalpattu, Tamil Nadu", lat: 12.8231, lng: 80.0445 },
    { id: "presidency",       name: "Presidency College",                 address: "Marina Beach, Chennai, Tamil Nadu",           lat: 13.0596, lng: 80.2812 },
    // Hospitals
    { id: "apollo-greams",    name: "Apollo Hospital Greams Road",        address: "Greams Road, Chennai, Tamil Nadu",            lat: 13.0604, lng: 80.2517 },
    { id: "fortis-malar",     name: "Fortis Malar Hospital",              address: "Adyar, Chennai, Tamil Nadu",                  lat: 13.0008, lng: 80.2518 },
    { id: "sri-ramachandra",  name: "Sri Ramachandra Medical Centre",     address: "Porur, Chennai, Tamil Nadu",                  lat: 13.0330, lng: 80.1584 },
    { id: "kilpauk-med",      name: "Kilpauk Medical College Hospital",   address: "Kilpauk, Chennai, Tamil Nadu",                lat: 13.0778, lng: 80.2422 },
    { id: "rajiv-gandhi-gh",  name: "Rajiv Gandhi Government General Hospital", address: "Park Town, Chennai, Tamil Nadu",        lat: 13.0790, lng: 80.2680 },
    // Landmarks & Malls
    { id: "marina-beach",     name: "Marina Beach",                       address: "Chennai, Tamil Nadu",                         lat: 13.0500, lng: 80.2824 },
    { id: "express-avenue",   name: "Express Avenue Mall",                address: "Royapettah, Chennai, Tamil Nadu",             lat: 13.0516, lng: 80.2670 },
    { id: "phoenix-chennai",  name: "Phoenix Marketcity Chennai",         address: "Velachery, Chennai, Tamil Nadu",              lat: 12.9867, lng: 80.2219 },
    { id: "forum-vijaya",     name: "Forum Vijaya Mall",                  address: "Vadapalani, Chennai, Tamil Nadu",             lat: 13.0505, lng: 80.2120 },
    { id: "anna-salai",       name: "Anna Salai (Mount Road)",            address: "Chennai, Tamil Nadu",                         lat: 13.0569, lng: 80.2598 },
    { id: "mahabalipuram",    name: "Mahabalipuram",                      address: "Chengalpattu District, Tamil Nadu",           lat: 12.6269, lng: 80.1927 },
    { id: "sriperumbudur",    name: "Sriperumbudur",                      address: "Kancheepuram District, Tamil Nadu",           lat: 12.9670, lng: 79.9448 },
    { id: "kancheepuram",     name: "Kancheepuram",                       address: "Kancheepuram, Tamil Nadu",                    lat: 12.8397, lng: 79.7000 },
    { id: "chengalpattu",     name: "Chengalpattu",                       address: "Chengalpattu, Tamil Nadu",                    lat: 12.6921, lng: 79.9793 },
    { id: "chen-trade",       name: "Chennai Trade Centre",               address: "Nandambakkam, Chennai, Tamil Nadu",           lat: 13.0174, lng: 80.1848 },
  ],

  trivandrum: [
    // Stations & Transit
    { id: "tvm-central",      name: "Thiruvananthapuram Central Railway Station", address: "Thampanoor, Trivandrum, Kerala",   lat: 8.4875,  lng: 76.9525 },
    { id: "tvm-kochuveli",    name: "Kochuveli Railway Station",          address: "Kochuveli, Trivandrum, Kerala",             lat: 8.4564,  lng: 76.9451 },
    { id: "tvm-nemom",        name: "Nemom Railway Station",              address: "Nemom, Trivandrum, Kerala",                 lat: 8.4766,  lng: 76.9267 },
    { id: "tvm-airport",      name: "Trivandrum International Airport",   address: "Chackai, Trivandrum, Kerala",               lat: 8.4821,  lng: 76.9201 },
    { id: "tvm-ksrtc",        name: "KSRTC Central Bus Station",          address: "Thampanoor, Trivandrum, Kerala",            lat: 8.4885,  lng: 76.9537 },
    { id: "tvm-east-fort",    name: "East Fort Bus Stop",                 address: "Fort, Trivandrum, Kerala",                  lat: 8.4940,  lng: 76.9467 },
    // Areas / Neighbourhoods
    { id: "palayam",          name: "Palayam",                            address: "Palayam, Trivandrum, Kerala",               lat: 8.5099,  lng: 76.9655 },
    { id: "pattom",           name: "Pattom",                             address: "Pattom, Trivandrum, Kerala",                lat: 8.5221,  lng: 76.9496 },
    { id: "kowdiar",          name: "Kowdiar",                            address: "Kowdiar, Trivandrum, Kerala",               lat: 8.5232,  lng: 76.9399 },
    { id: "kesavadasapuram",  name: "Kesavadasapuram",                    address: "Kesavadasapuram, Trivandrum, Kerala",       lat: 8.5118,  lng: 76.9546 },
    { id: "ulloor",           name: "Ulloor",                             address: "Ulloor, Trivandrum, Kerala",                lat: 8.5264,  lng: 76.9120 },
    { id: "sreekaryam",       name: "Sreekaryam",                         address: "Sreekaryam, Trivandrum, Kerala",            lat: 8.5421,  lng: 76.9003 },
    { id: "kazhakkoottam",    name: "Kazhakkoottam",                      address: "Kazhakkoottam, Trivandrum, Kerala",         lat: 8.5618,  lng: 76.8794 },
    { id: "attingal",         name: "Attingal",                           address: "Attingal, Trivandrum, Kerala",              lat: 8.6965,  lng: 76.8133 },
    { id: "neyyattinkara",    name: "Neyyattinkara",                      address: "Neyyattinkara, Trivandrum, Kerala",         lat: 8.4013,  lng: 77.0869 },
    { id: "varkala",          name: "Varkala",                            address: "Varkala, Trivandrum, Kerala",               lat: 8.7379,  lng: 76.7162 },
    { id: "poojappura",       name: "Poojappura",                         address: "Poojappura, Trivandrum, Kerala",            lat: 8.5010,  lng: 76.9455 },
    { id: "pangappara",       name: "Pangappara",                         address: "Pangappara, Trivandrum, Kerala",            lat: 8.5487,  lng: 76.9003 },
    { id: "peroorkada",       name: "Peroorkada",                         address: "Peroorkada, Trivandrum, Kerala",            lat: 8.5255,  lng: 76.9265 },
    { id: "thirumala",        name: "Thirumala",                          address: "Thirumala, Trivandrum, Kerala",             lat: 8.5354,  lng: 76.9285 },
    { id: "veli",             name: "Veli",                               address: "Veli, Trivandrum, Kerala",                  lat: 8.5009,  lng: 76.8903 },
    { id: "shanghumugham",    name: "Shankumugham Beach",                 address: "Shankumugham, Trivandrum, Kerala",          lat: 8.4860,  lng: 76.9064 },
    // Colleges & Institutions
    { id: "technopark",       name: "Technopark Campus",                  address: "Kazhakkoottam, Trivandrum, Kerala",         lat: 8.5581,  lng: 76.8816 },
    { id: "technopark-ph3",   name: "Technopark Phase 3",                 address: "Kazhakkoottam, Trivandrum, Kerala",         lat: 8.5560,  lng: 76.8770 },
    { id: "cet",              name: "College of Engineering Trivandrum",  address: "Sreekaryam, Trivandrum, Kerala",            lat: 8.5480,  lng: 76.9039 },
    { id: "univ-kerala",      name: "University of Kerala",               address: "Palayam, Trivandrum, Kerala",               lat: 8.5065,  lng: 76.9570 },
    { id: "med-college",      name: "Government Medical College",         address: "Medical College, Trivandrum, Kerala",        lat: 8.5241,  lng: 76.9366 },
    { id: "rcc",              name: "Regional Cancer Centre (RCC)",       address: "Medical College, Trivandrum, Kerala",        lat: 8.5230,  lng: 76.9389 },
    { id: "sctimt",           name: "Sree Chitra Thirunal Medical Institute", address: "Pacha Road, Trivandrum, Kerala",        lat: 8.5226,  lng: 76.9426 },
    { id: "ict-tvm",          name: "Indian Institute of Space Science & Technology", address: "Valiamala, Trivandrum, Kerala", lat: 8.5624,  lng: 77.0175 },
    // Hospitals
    { id: "kims-tvm",         name: "KIMS Hospital",                      address: "Anayara, Trivandrum, Kerala",               lat: 8.5116,  lng: 76.9488 },
    { id: "tvm-med-hosp",     name: "Government Medical College Hospital", address: "Medical College, Trivandrum, Kerala",       lat: 8.5241,  lng: 76.9366 },
    // Landmarks
    { id: "padmanabhaswamy",  name: "Padmanabhaswamy Temple",             address: "Fort, Trivandrum, Kerala",                  lat: 8.4827,  lng: 76.9437 },
    { id: "napier-museum",    name: "Napier Museum",                      address: "Museum Road, Trivandrum, Kerala",           lat: 8.5153,  lng: 76.9492 },
    { id: "kovalam",          name: "Kovalam Beach",                      address: "Kovalam, Trivandrum, Kerala",               lat: 8.4004,  lng: 76.9787 },
    { id: "zoo-tvm",          name: "Thiruvananthapuram Zoo",             address: "Museum Road, Trivandrum, Kerala",           lat: 8.5148,  lng: 76.9499 },
    { id: "infosys-tvm",      name: "Infosys Trivandrum",                 address: "Kazhakkoottam, Trivandrum, Kerala",         lat: 8.5498,  lng: 76.8792 },
  ],

  bangalore: [
    // Stations & Transit
    { id: "blr-city",         name: "KSR Bengaluru City Railway Station", address: "Majestic, Bengaluru, Karnataka",            lat: 12.9772, lng: 77.5665 },
    { id: "blr-yeshwanthpur", name: "Yeshwanthpur Railway Station",       address: "Yeshwanthpur, Bengaluru, Karnataka",        lat: 13.0230, lng: 77.5421 },
    { id: "blr-ksr-metro",    name: "Majestic Metro Station",             address: "Majestic, Bengaluru, Karnataka",            lat: 12.9774, lng: 77.5730 },
    { id: "blr-mg-metro",     name: "MG Road Metro Station",              address: "MG Road, Bengaluru, Karnataka",             lat: 12.9758, lng: 77.6068 },
    { id: "blr-indiranagar-m",name: "Indiranagar Metro Station",          address: "Indiranagar, Bengaluru, Karnataka",         lat: 12.9781, lng: 77.6407 },
    { id: "blr-byp-metro",    name: "Baiyappanahalli Metro Station",      address: "Baiyappanahalli, Bengaluru, Karnataka",     lat: 12.9862, lng: 77.6501 },
    { id: "blr-silk-metro",   name: "Silk Board Metro Station",           address: "Silk Board, Bengaluru, Karnataka",          lat: 12.9166, lng: 77.6230 },
    { id: "blr-ecity-metro",  name: "Electronic City Metro Station",      address: "Electronic City, Bengaluru, Karnataka",     lat: 12.8454, lng: 77.6609 },
    { id: "blr-kia",          name: "Kempegowda International Airport",   address: "Devanahalli, Bengaluru, Karnataka",         lat: 13.1986, lng: 77.7066 },
    { id: "blr-majestic",     name: "Kempegowda Bus Station (Majestic)",  address: "Majestic, Bengaluru, Karnataka",            lat: 12.9779, lng: 77.5725 },
    // Areas / Neighbourhoods
    { id: "mg-road",          name: "MG Road",                            address: "MG Road, Bengaluru, Karnataka",             lat: 12.9756, lng: 77.6063 },
    { id: "indiranagar",      name: "Indiranagar",                        address: "Indiranagar, Bengaluru, Karnataka",         lat: 12.9784, lng: 77.6408 },
    { id: "koramangala",      name: "Koramangala",                        address: "Koramangala, Bengaluru, Karnataka",         lat: 12.9352, lng: 77.6245 },
    { id: "whitefield",       name: "Whitefield",                         address: "Whitefield, Bengaluru, Karnataka",          lat: 12.9698, lng: 77.7499 },
    { id: "hsr-layout",       name: "HSR Layout",                         address: "HSR Layout, Bengaluru, Karnataka",          lat: 12.9116, lng: 77.6473 },
    { id: "btm-layout",       name: "BTM Layout",                         address: "BTM Layout, Bengaluru, Karnataka",          lat: 12.9166, lng: 77.6101 },
    { id: "electronic-city",  name: "Electronic City",                    address: "Electronic City, Bengaluru, Karnataka",     lat: 12.8392, lng: 77.6774 },
    { id: "marathahalli",     name: "Marathahalli",                       address: "Marathahalli, Bengaluru, Karnataka",        lat: 12.9591, lng: 77.6974 },
    { id: "sarjapur",         name: "Sarjapur Road",                      address: "Sarjapur, Bengaluru, Karnataka",            lat: 12.9096, lng: 77.7063 },
    { id: "hebbal",           name: "Hebbal",                             address: "Hebbal, Bengaluru, Karnataka",              lat: 13.0358, lng: 77.5970 },
    { id: "yelahanka",        name: "Yelahanka",                          address: "Yelahanka, Bengaluru, Karnataka",           lat: 13.1005, lng: 77.5963 },
    { id: "malleswaram",      name: "Malleswaram",                        address: "Malleswaram, Bengaluru, Karnataka",         lat: 12.9988, lng: 77.5690 },
    { id: "rajajinagar",      name: "Rajajinagar",                        address: "Rajajinagar, Bengaluru, Karnataka",         lat: 12.9932, lng: 77.5540 },
    { id: "jayanagar",        name: "Jayanagar",                          address: "Jayanagar, Bengaluru, Karnataka",           lat: 12.9308, lng: 77.5838 },
    { id: "jp-nagar",         name: "JP Nagar",                           address: "JP Nagar, Bengaluru, Karnataka",            lat: 12.9076, lng: 77.5870 },
    { id: "banashankari",     name: "Banashankari",                       address: "Banashankari, Bengaluru, Karnataka",        lat: 12.9270, lng: 77.5490 },
    { id: "bellandur",        name: "Bellandur",                          address: "Bellandur, Bengaluru, Karnataka",           lat: 12.9260, lng: 77.6780 },
    { id: "peenya",           name: "Peenya Industrial Area",             address: "Peenya, Bengaluru, Karnataka",              lat: 13.0292, lng: 77.5175 },
    { id: "rt-nagar",         name: "RT Nagar",                           address: "RT Nagar, Bengaluru, Karnataka",            lat: 13.0246, lng: 77.5967 },
    { id: "sadashivanagar",   name: "Sadashivanagar",                     address: "Sadashivanagar, Bengaluru, Karnataka",      lat: 13.0041, lng: 77.5672 },
    { id: "nagawara",         name: "Nagawara",                           address: "Nagawara, Bengaluru, Karnataka",            lat: 13.0442, lng: 77.6175 },
    { id: "kr-puram",         name: "KR Puram",                          address: "KR Puram, Bengaluru, Karnataka",            lat: 13.0112, lng: 77.7037 },
    { id: "hoodi",            name: "Hoodi",                              address: "Hoodi, Bengaluru, Karnataka",               lat: 12.9890, lng: 77.7097 },
    // Colleges & Universities
    { id: "iisc",             name: "Indian Institute of Science (IISc)", address: "Malleswaram, Bengaluru, Karnataka",         lat: 13.0219, lng: 77.5671 },
    { id: "iimb",             name: "IIM Bangalore",                      address: "Bannerghatta Road, Bengaluru, Karnataka",   lat: 12.9351, lng: 77.5975 },
    { id: "christ-univ",      name: "Christ University",                  address: "Hosur Road, Bengaluru, Karnataka",          lat: 12.9347, lng: 77.6072 },
    { id: "rv-college",       name: "RV College of Engineering",          address: "Mysore Road, Bengaluru, Karnataka",         lat: 12.9232, lng: 77.4989 },
    { id: "bms-college",      name: "BMS College of Engineering",         address: "Bull Temple Road, Bengaluru, Karnataka",    lat: 12.9434, lng: 77.5669 },
    // Hospitals
    { id: "manipal-blr",      name: "Manipal Hospital Old Airport Road",  address: "Old Airport Road, Bengaluru, Karnataka",   lat: 12.9592, lng: 77.6479 },
    { id: "fortis-bannerghatta",name:"Fortis Hospital Bannerghatta Road",  address: "Bannerghatta Road, Bengaluru, Karnataka",  lat: 12.8935, lng: 77.5972 },
    { id: "victoria-hosp",    name: "Victoria Hospital",                  address: "Majestic, Bengaluru, Karnataka",            lat: 12.9592, lng: 77.5841 },
    { id: "apollo-blr",       name: "Apollo Hospital Bannerghatta Road",  address: "Bannerghatta Road, Bengaluru, Karnataka",   lat: 12.8888, lng: 77.5966 },
    { id: "narayana-health",  name: "Narayana Health City",               address: "Hosur Road, Bengaluru, Karnataka",          lat: 12.8832, lng: 77.5910 },
    // Landmarks & Malls
    { id: "lalbagh",          name: "Lalbagh Botanical Garden",           address: "Lalbagh, Bengaluru, Karnataka",             lat: 12.9507, lng: 77.5848 },
    { id: "cubbon-park",      name: "Cubbon Park",                        address: "Kasturba Road, Bengaluru, Karnataka",       lat: 12.9766, lng: 77.5926 },
    { id: "vidhana-soudha",   name: "Vidhana Soudha",                     address: "Dr Ambedkar Veedhi, Bengaluru, Karnataka",  lat: 12.9791, lng: 77.5906 },
    { id: "orion-mall",       name: "Orion Mall",                         address: "Rajajinagar, Bengaluru, Karnataka",         lat: 13.0005, lng: 77.5547 },
    { id: "phoenix-blr",      name: "Phoenix Marketcity Bengaluru",       address: "Whitefield, Bengaluru, Karnataka",          lat: 12.9969, lng: 77.6964 },
    { id: "forum-koramangala",name: "Forum Mall Koramangala",             address: "Koramangala, Bengaluru, Karnataka",         lat: 12.9366, lng: 77.6122 },
    { id: "airport-blr",      name: "Kempegowda International Airport",   address: "Devanahalli, Bengaluru, Karnataka",         lat: 13.1986, lng: 77.7066 },
  ],

  hyderabad: [
    // Stations & Transit
    { id: "hyd-sec",          name: "Secunderabad Railway Junction",      address: "Secunderabad, Hyderabad, Telangana",        lat: 17.4399, lng: 78.4983 },
    { id: "hyd-nampally",     name: "Hyderabad Deccan (Nampally) Station",address: "Nampally, Hyderabad, Telangana",            lat: 17.3842, lng: 78.4743 },
    { id: "hyd-kacheguda",    name: "Kacheguda Railway Station",          address: "Kacheguda, Hyderabad, Telangana",           lat: 17.3929, lng: 78.4932 },
    { id: "hyd-airport",      name: "Rajiv Gandhi International Airport", address: "Shamshabad, Hyderabad, Telangana",          lat: 17.2403, lng: 78.4294 },
    { id: "hyd-mgbs",         name: "MGBS Imlibun Bus Stand",             address: "Imlibun, Hyderabad, Telangana",             lat: 17.3802, lng: 78.4740 },
    { id: "hyd-jbs",          name: "Jubilee Bus Station (JBS)",          address: "Secunderabad, Hyderabad, Telangana",        lat: 17.4426, lng: 78.4994 },
    // Metro Stations
    { id: "hyd-ameerpet",     name: "Ameerpet Metro Station",             address: "Ameerpet, Hyderabad, Telangana",            lat: 17.4358, lng: 78.4450 },
    { id: "hyd-hitech-metro", name: "HITEC City Metro Station",           address: "Madhapur, Hyderabad, Telangana",            lat: 17.4471, lng: 78.3742 },
    { id: "hyd-raidurg",      name: "Raidurg Metro Station",              address: "Raidurg, Hyderabad, Telangana",             lat: 17.4402, lng: 78.3628 },
    { id: "hyd-miyapur",      name: "Miyapur Metro Station",              address: "Miyapur, Hyderabad, Telangana",             lat: 17.4968, lng: 78.3627 },
    { id: "hyd-kphb",         name: "KPHB Colony Metro Station",          address: "KPHB, Hyderabad, Telangana",                lat: 17.4830, lng: 78.3919 },
    { id: "hyd-kukatpally",   name: "Kukatpally Metro Station",           address: "Kukatpally, Hyderabad, Telangana",          lat: 17.4944, lng: 78.4121 },
    { id: "hyd-punjagutta",   name: "Punjagutta Metro Station",           address: "Punjagutta, Hyderabad, Telangana",          lat: 17.4263, lng: 78.4497 },
    { id: "hyd-lakdikapul",   name: "Lakdikapul Metro Station",           address: "Lakdikapul, Hyderabad, Telangana",          lat: 17.3995, lng: 78.4626 },
    // Areas / Neighbourhoods
    { id: "hyd-hitech",       name: "HITEC City",                         address: "Madhapur, Hyderabad, Telangana",            lat: 17.4435, lng: 78.3772 },
    { id: "hyd-gachibowli",   name: "Gachibowli",                         address: "Gachibowli, Hyderabad, Telangana",          lat: 17.4401, lng: 78.3489 },
    { id: "hyd-banjara",      name: "Banjara Hills",                      address: "Banjara Hills, Hyderabad, Telangana",       lat: 17.4150, lng: 78.4350 },
    { id: "hyd-jubilee",      name: "Jubilee Hills",                      address: "Jubilee Hills, Hyderabad, Telangana",       lat: 17.4324, lng: 78.4072 },
    { id: "hyd-madhapur",     name: "Madhapur",                           address: "Madhapur, Hyderabad, Telangana",            lat: 17.4487, lng: 78.3916 },
    { id: "hyd-kondapur",     name: "Kondapur",                           address: "Kondapur, Hyderabad, Telangana",            lat: 17.4600, lng: 78.3641 },
    { id: "hyd-manikonda",    name: "Manikonda",                          address: "Manikonda, Hyderabad, Telangana",           lat: 17.4046, lng: 78.3872 },
    { id: "hyd-nanakramguda", name: "Nanakramguda",                       address: "Nanakramguda, Hyderabad, Telangana",        lat: 17.4193, lng: 78.3590 },
    { id: "hyd-tolichowki",   name: "Tolichowki",                         address: "Tolichowki, Hyderabad, Telangana",          lat: 17.4047, lng: 78.4227 },
    { id: "hyd-mehdipatnam",  name: "Mehdipatnam",                        address: "Mehdipatnam, Hyderabad, Telangana",         lat: 17.3952, lng: 78.4415 },
    { id: "hyd-abids",        name: "Abids",                              address: "Abids, Hyderabad, Telangana",               lat: 17.3885, lng: 78.4820 },
    { id: "hyd-koti",         name: "Koti",                               address: "Koti, Hyderabad, Telangana",                lat: 17.3835, lng: 78.4821 },
    { id: "hyd-dilsukhnagar", name: "Dilsukhnagar",                       address: "Dilsukhnagar, Hyderabad, Telangana",        lat: 17.3685, lng: 78.5260 },
    { id: "hyd-lb-nagar",     name: "LB Nagar",                           address: "LB Nagar, Hyderabad, Telangana",            lat: 17.3477, lng: 78.5519 },
    { id: "hyd-uppal",        name: "Uppal",                              address: "Uppal, Hyderabad, Telangana",               lat: 17.4050, lng: 78.5587 },
    { id: "hyd-malkajgiri",   name: "Malkajgiri",                         address: "Malkajgiri, Hyderabad, Telangana",          lat: 17.4643, lng: 78.5280 },
    { id: "hyd-begumpet",     name: "Begumpet",                           address: "Begumpet, Hyderabad, Telangana",            lat: 17.4427, lng: 78.4697 },
    { id: "hyd-marredpally",  name: "Marredpally",                        address: "Marredpally, Secunderabad, Telangana",      lat: 17.4450, lng: 78.5042 },
    { id: "hyd-tarnaka",      name: "Tarnaka",                            address: "Tarnaka, Hyderabad, Telangana",             lat: 17.4380, lng: 78.5302 },
    { id: "hyd-miyapur-area", name: "Miyapur",                            address: "Miyapur, Hyderabad, Telangana",             lat: 17.4968, lng: 78.3627 },
    // Colleges & Universities
    { id: "hyd-univ",         name: "University of Hyderabad",            address: "Gachibowli, Hyderabad, Telangana",          lat: 17.4559, lng: 78.3457 },
    { id: "hyd-osmania",      name: "Osmania University",                 address: "Tarnaka, Hyderabad, Telangana",             lat: 17.4154, lng: 78.5280 },
    { id: "iit-hyd",          name: "IIT Hyderabad",                      address: "Kandi, Sangareddy, Telangana",              lat: 17.5930, lng: 78.1219 },
    { id: "iiit-hyd",         name: "IIIT Hyderabad",                     address: "Gachibowli, Hyderabad, Telangana",          lat: 17.4450, lng: 78.3491 },
    { id: "bits-hyd",         name: "BITS Pilani Hyderabad Campus",       address: "Jawahar Nagar, Hyderabad, Telangana",       lat: 17.5449, lng: 78.5710 },
    // Hospitals
    { id: "apollo-hyd",       name: "Apollo Hospital Jubilee Hills",      address: "Jubilee Hills, Hyderabad, Telangana",       lat: 17.4194, lng: 78.4102 },
    { id: "yashoda-hyd",      name: "Yashoda Hospital Secunderabad",      address: "Secunderabad, Hyderabad, Telangana",        lat: 17.4412, lng: 78.5121 },
    { id: "nims-hyd",         name: "NIMS (Nizams Institute)",            address: "Punjagutta, Hyderabad, Telangana",          lat: 17.4277, lng: 78.4484 },
    { id: "lvpei-hyd",        name: "L V Prasad Eye Institute",           address: "Banjara Hills, Hyderabad, Telangana",       lat: 17.4256, lng: 78.4315 },
    // Landmarks
    { id: "hyd-charminar",    name: "Charminar",                          address: "Old City, Hyderabad, Telangana",            lat: 17.3616, lng: 78.4747 },
    { id: "hyd-golconda",     name: "Golconda Fort",                      address: "Golconda, Hyderabad, Telangana",            lat: 17.3833, lng: 78.4011 },
    { id: "hussain-sagar",    name: "Hussain Sagar Lake",                 address: "Tank Bund, Hyderabad, Telangana",           lat: 17.4239, lng: 78.4738 },
    { id: "hyd-ikea",         name: "IKEA Hyderabad",                     address: "Hitex Road, Hyderabad, Telangana",          lat: 17.4574, lng: 78.3659 },
    { id: "hyd-inorbit",      name: "Inorbit Mall Cyberabad",             address: "Mindspace, Hyderabad, Telangana",           lat: 17.4521, lng: 78.3868 },
    { id: "hyd-forum",        name: "Forum Sujana Mall",                  address: "Kukatpally, Hyderabad, Telangana",          lat: 17.4940, lng: 78.4136 },
    { id: "hyd-gvk-one",      name: "GVK One Mall",                       address: "Banjara Hills, Hyderabad, Telangana",       lat: 17.4128, lng: 78.4366 },
    { id: "ramoji",           name: "Ramoji Film City",                   address: "Hayathnagar, Hyderabad, Telangana",         lat: 17.2543, lng: 78.6801 },
    { id: "salar-jung",       name: "Salar Jung Museum",                  address: "Dar-ul-Shifa, Hyderabad, Telangana",        lat: 17.3713, lng: 78.4814 },
  ],
};

export function filterLocalSuggestions(cityId: CityId, query: string, limit = 8): LocalPlaceSuggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const scored = LOCAL_PLACE_SUGGESTIONS[cityId]
    .map((place) => {
      const name = place.name.toLowerCase();
      const address = place.address.toLowerCase();
      let score = 0;
      if (name.startsWith(q)) score += 100;
      else if (name.includes(q)) score += 60;
      if (address.includes(q)) score += 30;
      return { place, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((item) => item.place);
}

export function demoZones(cityId: CityId) {
  const c = DEMO_CITY_CENTERS[cityId];
  return [
    {
      id: "demo-1",
      city_id: cityId,
      zone_type: "moderate",
      label: "Demo zone (enable live mode for real data)",
      latitude: c.lat,
      longitude: c.lng,
      risk_weight: 0.5,
    },
  ];
}

export function demoSafeSpots(cityId: CityId): SafeWaitingSpot[] {
  return emergencyFallbackSpots(cityId);
}

/** Curated safe spots used when Overpass is slow or unavailable */
export function emergencyFallbackSpots(cityId: CityId): SafeWaitingSpot[] {
  const spots: Record<CityId, SafeWaitingSpot[]> = {
    chennai: [
      { id: "fb-chen-ripon", city_id: "chennai", spot_type: "police", name: "Chennai City Police HQ", latitude: 13.0845, longitude: 80.272, is_24x7: true, safe_waiting_score: 90 },
      { id: "fb-chen-gh", city_id: "chennai", spot_type: "hospital", name: "Rajiv Gandhi Govt General Hospital", latitude: 13.079, longitude: 80.268, is_24x7: true, safe_waiting_score: 88 },
      { id: "fb-chen-metro", city_id: "chennai", spot_type: "metro", name: "Government Estate Metro", latitude: 13.0785, longitude: 80.2745, is_24x7: true, safe_waiting_score: 84 },
      { id: "fb-chen-pharm", city_id: "chennai", spot_type: "pharmacy", name: "Parry's Corner 24/7 Pharmacy", latitude: 13.0865, longitude: 80.281, is_24x7: true, safe_waiting_score: 74 },
      { id: "fb-apollo", city_id: "chennai", spot_type: "hospital", name: "Apollo Hospitals Greams Road", latitude: 13.0604, longitude: 80.2517, is_24x7: true, safe_waiting_score: 92 },
      { id: "fb-egmore-police", city_id: "chennai", spot_type: "police", name: "Egmore Police Station", latitude: 13.0735, longitude: 80.2612, is_24x7: true, safe_waiting_score: 90 },
      { id: "fb-central", city_id: "chennai", spot_type: "railway", name: "Chennai Central Railway Station", latitude: 13.0827, longitude: 80.2751, is_24x7: true, safe_waiting_score: 85 },
      { id: "fb-airport", city_id: "chennai", spot_type: "metro", name: "Chennai Airport", latitude: 12.9941, longitude: 80.1709, is_24x7: true, safe_waiting_score: 84 },
      { id: "fb-kilpauk", city_id: "chennai", spot_type: "hospital", name: "Kilpauk Medical College Hospital", latitude: 13.0778, longitude: 80.2422, is_24x7: true, safe_waiting_score: 88 },
      { id: "fb-anna-nagar", city_id: "chennai", spot_type: "police", name: "Anna Nagar Police Station", latitude: 13.0872, longitude: 80.2115, is_24x7: false, safe_waiting_score: 86 },
      { id: "fb-tnagar", city_id: "chennai", spot_type: "pharmacy", name: "T Nagar 24/7 Pharmacy Zone", latitude: 13.0418, longitude: 80.2341, is_24x7: true, safe_waiting_score: 74 },
      { id: "fb-omr-fuel", city_id: "chennai", spot_type: "petrol_pump", name: "OMR BP Fuel Station", latitude: 12.9496, longitude: 80.2372, is_24x7: true, safe_waiting_score: 78 },
    ],
    trivandrum: [
      { id: "fb-tvm-central-near", city_id: "trivandrum", spot_type: "railway", name: "Thampanoor Station Security", latitude: 8.4878, longitude: 76.953, is_24x7: true, safe_waiting_score: 86 },
      { id: "fb-tvm-palayam-near", city_id: "trivandrum", spot_type: "pharmacy", name: "Palayam Junction Pharmacy", latitude: 8.5105, longitude: 76.966, is_24x7: false, safe_waiting_score: 72 },
      { id: "fb-tvm-med-near", city_id: "trivandrum", spot_type: "hospital", name: "Medical College Emergency", latitude: 8.5255, longitude: 76.9375, is_24x7: true, safe_waiting_score: 90 },
      { id: "fb-tvm-hosp", city_id: "trivandrum", spot_type: "hospital", name: "Medical College Hospital", latitude: 8.5241, longitude: 76.9366, is_24x7: true, safe_waiting_score: 90 },
      { id: "fb-tvm-police", city_id: "trivandrum", spot_type: "police", name: "Thampanoor Police Station", latitude: 8.4875, longitude: 76.9525, is_24x7: true, safe_waiting_score: 88 },
      { id: "fb-technopark", city_id: "trivandrum", spot_type: "metro", name: "Technopark Campus Security", latitude: 8.5581, longitude: 76.8816, is_24x7: true, safe_waiting_score: 82 },
      { id: "fb-palayam", city_id: "trivandrum", spot_type: "pharmacy", name: "Palayam Medical Stores", latitude: 8.5099, longitude: 76.9655, is_24x7: false, safe_waiting_score: 72 },
    ],
    bangalore: [
      { id: "fb-blr-majestic", city_id: "bangalore", spot_type: "police", name: "Kempegowda Bus Stand Police", latitude: 12.9768, longitude: 77.5725, is_24x7: true, safe_waiting_score: 88 },
      { id: "fb-blr-victoria-near", city_id: "bangalore", spot_type: "hospital", name: "Victoria Hospital Emergency", latitude: 12.9595, longitude: 77.5845, is_24x7: true, safe_waiting_score: 90 },
      { id: "fb-blr-mg-near", city_id: "bangalore", spot_type: "metro", name: "MG Road Metro Station", latitude: 12.9758, longitude: 77.6068, is_24x7: true, safe_waiting_score: 84 },
      { id: "fb-victoria", city_id: "bangalore", spot_type: "hospital", name: "Victoria Hospital", latitude: 12.9592, longitude: 77.5841, is_24x7: true, safe_waiting_score: 90 },
      { id: "fb-kg-police", city_id: "bangalore", spot_type: "police", name: "Majestic Police Station", latitude: 12.9772, longitude: 77.5665, is_24x7: true, safe_waiting_score: 88 },
      { id: "fb-mg-metro", city_id: "bangalore", spot_type: "metro", name: "MG Road Metro Station", latitude: 12.9756, longitude: 77.6063, is_24x7: true, safe_waiting_score: 84 },
      { id: "fb-indira", city_id: "bangalore", spot_type: "hospital", name: "Indiranagar 100 Feet Road Clinic", latitude: 12.9784, longitude: 77.6408, is_24x7: false, safe_waiting_score: 80 },
      { id: "fb-whitefield", city_id: "bangalore", spot_type: "petrol_pump", name: "Whitefield 24/7 Fuel Station", latitude: 12.9698, longitude: 77.7499, is_24x7: true, safe_waiting_score: 76 },
    ],
    hyderabad: [
      { id: "fb-hyd-sec-near", city_id: "hyderabad", spot_type: "railway", name: "Secunderabad Station Security", latitude: 17.4402, longitude: 78.4988, is_24x7: true, safe_waiting_score: 85 },
      { id: "fb-hyd-ameerpet", city_id: "hyderabad", spot_type: "metro", name: "Ameerpet Metro Interchange", latitude: 17.4358, longitude: 78.445, is_24x7: true, safe_waiting_score: 83 },
      { id: "fb-hyd-banjara", city_id: "hyderabad", spot_type: "police", name: "Banjara Hills Police Station", latitude: 17.416, longitude: 78.435, is_24x7: true, safe_waiting_score: 87 },
      { id: "fb-hyd-hosp", city_id: "hyderabad", spot_type: "hospital", name: "Apollo Hospitals Jubilee Hills", latitude: 17.4194, longitude: 78.4102, is_24x7: true, safe_waiting_score: 91 },
      { id: "fb-hyd-police", city_id: "hyderabad", spot_type: "police", name: "Banjara Hills Police Station", latitude: 17.4156, longitude: 78.4347, is_24x7: true, safe_waiting_score: 87 },
      { id: "fb-hyd-metro", city_id: "hyderabad", spot_type: "metro", name: "Ameerpet Metro Station", latitude: 17.4355, longitude: 78.4446, is_24x7: true, safe_waiting_score: 83 },
      { id: "fb-hyd-sec", city_id: "hyderabad", spot_type: "railway", name: "Secunderabad Railway Station", latitude: 17.4399, longitude: 78.4983, is_24x7: true, safe_waiting_score: 85 },
    ],
  };
  return spots[cityId] ?? [];
}
