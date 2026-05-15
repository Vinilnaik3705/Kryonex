import MainLayout from '../layouts/MainLayout';
import CryptoHeatmapGrid from '../components/ui/CryptoHeatmapGrid';

export default function Heatmap() {
    return (
        <MainLayout>
            <div className="mx-auto max-w-[1600px]">
                <CryptoHeatmapGrid />
                </div>
        </MainLayout>
    );
}
