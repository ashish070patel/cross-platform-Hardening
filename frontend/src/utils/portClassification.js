
const knownPorts = {
  135: { service: "Windows RPC", category: "sensitive" },
  139: { service: "NetBIOS", category: "sensitive" },
  445: { service: "SMB", category: "sensitive" },

  3306: { service: "MySQL", category: "database" },
  33060: { service: "MySQL X", category: "database" },
  5432: { service: "PostgreSQL", category: "database" },
  27017: { service: "MongoDB", category: "database" },

  902: { service: "VMware", category: "management" },
  912: { service: "VMware", category: "management" },
  5939: { service: "Remote Access", category: "management" },

  5000: { service: "Development/API", category: "development" },
  5173: { service: "Vite", category: "development" },
};

export function classifyPort(port) {
  const number = Number(port);

  if (knownPorts[number]) {
    return knownPorts[number];
  }

  if (number >= 49152 && number <= 65535) {
    return {
      service: "Dynamic Port",
      category: "dynamic",
    };
  }

  return {
    service: "Unidentified",
    category: "unknown",
  };
}
