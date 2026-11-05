import { CityPartPage, cityMetadata, cityStaticParams } from "@/components/city/CityPartPage";

export const dynamicParams = false;
export const generateStaticParams = cityStaticParams;

type Props = { params: Promise<{ city: string }> };

export async function generateMetadata({ params }: Props) {
  return cityMetadata("battery", (await params).city);
}

export default async function Page({ params }: Props) {
  return <CityPartPage partKey="battery" citySlug={(await params).city} />;
}
