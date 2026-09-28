import HomeHero from './HomeHero';
import { LatestAnnouncements, ServiceCatalogue } from './HomeBlocks';
import { KnowYourRights, PublicationsTeaser } from './HomeInfoBlocks';

/**
 * Landing page. The government header and footer are rendered by PublicLayout.
 */
export default function HomePage() {
  return (
    <>
      <HomeHero />
      <ServiceCatalogue />
      <LatestAnnouncements />
      <KnowYourRights />
      <PublicationsTeaser />
    </>
  );
}
