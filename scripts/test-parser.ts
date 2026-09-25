import { fetchDetails } from "../src/ptv-disruption-details/fetch-details";

// Run with: npx tsx scripts/test-parser.ts

async function main() {
  const data = await fetchDetails(
    "https://transport.vic.gov.au/disruptions/disruptions-information/article/gippsland-line-coaches-will-replace-trains-on-the-traralgon-and-bairnsdale-lines-for-all-or-part-the-journey-from-saturday-14-june-to-wednesday-13-august-2025",
  );

  console.log(data);
}

main();
