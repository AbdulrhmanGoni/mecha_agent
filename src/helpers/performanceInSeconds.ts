export default function performanceInSeconds(startingPoint: number): string {
    return ((performance.now() - startingPoint) / 1000).toFixed(3) + "s";
}
