export type Helpline = {
  name: string;
  number: string;
  description: string;
  tel: string;
};

export const NATIONAL_HELPLINES: Helpline[] = [
  {
    name: "Emergency (All India)",
    number: "112",
    description: "Unified emergency response",
    tel: "tel:112",
  },
  {
    name: "Police",
    number: "100",
    description: "Police emergency",
    tel: "tel:100",
  },
  {
    name: "Women's Helpline",
    number: "1091",
    description: "24×7 women in distress",
    tel: "tel:1091",
  },
  {
    name: "Women's Helpline (Ministry)",
    number: "181",
    description: "Ministry of Women & Child Development",
    tel: "tel:181",
  },
  {
    name: "Ambulance",
    number: "108",
    description: "Medical emergency",
    tel: "tel:108",
  },
  {
    name: "Child Helpline",
    number: "1098",
    description: "Child in distress",
    tel: "tel:1098",
  },
];
