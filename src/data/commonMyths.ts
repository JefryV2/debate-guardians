
export interface Myth {
  claim: string;
  verdict: string;
  source: string;
  explanation: string;
}

export const commonMyths: Myth[] = [
  {
    claim: "Vaccines cause autism",
    verdict: "false",
    source: "CDC, WHO (2023)",
    explanation: "Multiple large-scale studies have found no link between vaccines and autism."
  },
  {
    claim: "Climate change is not caused by human activity",
    verdict: "false",
    source: "NASA, IPCC (2022)",
    explanation: "Over 97% of climate scientists agree that human activities are causing climate change."
  },
  {
    claim: "The Earth is flat",
    verdict: "false",
    source: "NASA, Modern Science",
    explanation: "The Earth is an oblate spheroid, as proven by satellite imagery, physics, and direct observation."
  },
  {
    claim: "COVID-19 is just a common cold",
    verdict: "false",
    source: "WHO, CDC (2021)",
    explanation: "COVID-19 is caused by a different virus (SARS-CoV-2) and has a much higher mortality rate than the common cold."
  },
  {
    claim: "5G towers spread viruses",
    verdict: "false",
    source: "WHO, Scientific Community (2021)",
    explanation: "Radio waves cannot transmit viruses, which are biological entities that require a host to replicate."
  },
  {
    claim: "Drinking bleach cures diseases",
    verdict: "false",
    source: "FDA, Medical Consensus (2020)",
    explanation: "Drinking bleach is extremely dangerous and can cause serious injury or death."
  },
  {
    claim: "Evolution is just a theory, not proven fact",
    verdict: "false",
    source: "Scientific Consensus",
    explanation: "In science, a theory is a well-substantiated explanation. Evolution is supported by overwhelming evidence."
  },
  {
    claim: "We only use 10% of our brains",
    verdict: "false",
    source: "Neurological Research",
    explanation: "Modern imaging shows activity throughout the brain, even during simple tasks."
  }
];
