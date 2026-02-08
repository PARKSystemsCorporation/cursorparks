/**
 * Cloudflare Pages Function: Analytics API Proxy
 * 
 * This function fetches analytics data from Cloudflare's GraphQL Analytics API
 * and returns it in a format suitable for the BuilderOS Terminal dashboard.
 * 
 * Required Environment Variables (set in Cloudflare Pages dashboard):
 * - CF_API_TOKEN: Cloudflare API token with Analytics:Read permission
 * - CF_ZONE_ID: Your Cloudflare Zone ID
 * 
 * To create an API token:
 * 1. Go to https://dash.cloudflare.com/profile/api-tokens
 * 2. Create Token > Custom Token
 * 3. Permissions: Zone > Analytics > Read
 * 4. Zone Resources: Include > Specific zone > [your zone]
 */

export async function onRequest(context) {
    const { env } = context;
    
    // CORS headers for local development
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
    };

    // Handle preflight requests
    if (context.request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Check for required environment variables
        const apiToken = env.CF_API_TOKEN;
        const zoneId = env.CF_ZONE_ID;

        if (!apiToken || !zoneId) {
            console.error('Missing environment variables');
            return new Response(
                JSON.stringify({ ...generateMockData(), mock: true, error: 'Missing CF_API_TOKEN and/or CF_ZONE_ID' }),
                { status: 503, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
            );
        }

        // Calculate time range (last 24 hours)
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        // Format dates for GraphQL
        const datetimeStart = yesterday.toISOString();
        const datetimeEnd = now.toISOString();

        // GraphQL query for hourly data with unique visitors and requests
        const query = `
            query GetAnalytics($zoneTag: String!, $datetimeStart: Time!, $datetimeEnd: Time!) {
                viewer {
                    zones(filter: { zoneTag: $zoneTag }) {
                        # Hourly breakdown for chart
                        hourlyData: httpRequests1hGroups(
                            limit: 48
                            filter: {
                                datetime_geq: $datetimeStart
                                datetime_lt: $datetimeEnd
                            }
                            orderBy: [datetime_ASC]
                        ) {
                            dimensions {
                                datetime
                            }
                            sum {
                                requests
                                bytes
                                cachedBytes
                                cachedRequests
                                pageViews
                            }
                            uniq {
                                uniques
                            }
                        }
                        
                        # Current totals
                        totals: httpRequests1hGroups(
                            limit: 1
                            filter: {
                                datetime_geq: $datetimeStart
                                datetime_lt: $datetimeEnd
                            }
                            orderBy: [datetime_DESC]
                        ) {
                            sum {
                                requests
                                bytes
                                cachedBytes
                                cachedRequests
                            }
                            uniq {
                                uniques
                            }
                        }
                        
                        # Visits data (adaptive groups for more accuracy)
                        visitsData: httpRequestsAdaptiveGroups(
                            limit: 48
                            filter: {
                                datetime_geq: $datetimeStart
                                datetime_lt: $datetimeEnd
                                requestSource: "eyeball"
                            }
                            orderBy: [datetime_ASC]
                        ) {
                            dimensions {
                                datetimeHour
                            }
                            sum {
                                visits
                                edgeResponseBytes
                            }
                            count
                        }
                    }
                }
            }
        `;

        const variables = {
            zoneTag: zoneId,
            datetimeStart: datetimeStart,
            datetimeEnd: datetimeEnd
        };

        // Make the GraphQL request
        const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query, variables })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Cloudflare API error:', response.status, errorText);
            throw new Error(`API request failed: ${response.status}`);
        }

        const result = await response.json();

        if (result.errors) {
            console.error('GraphQL errors:', result.errors);
            throw new Error('GraphQL query failed');
        }

        // Transform the data for the dashboard
        const transformedData = transformAnalyticsData(result.data);

        return new Response(
            JSON.stringify(transformedData),
            { headers: corsHeaders }
        );

    } catch (error) {
        console.error('Analytics fetch error:', error);
        
        // Return mock data on error
        return new Response(
            JSON.stringify({ ...generateMockData(), mock: true, error: 'Analytics fetch error' }),
            { status: 502, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
    }
}

/**
 * Transform Cloudflare GraphQL response into dashboard format
 */
function transformAnalyticsData(data) {
    const zones = data?.viewer?.zones?.[0];
    
    if (!zones) {
        return generateMockData();
    }

    const hourlyData = zones.hourlyData || [];
    const totals = zones.totals?.[0] || {};
    const visitsData = zones.visitsData || [];

    // Create a map of visits by hour for merging
    const visitsMap = new Map();
    visitsData.forEach(item => {
        const hour = item.dimensions?.datetimeHour;
        if (hour) {
            visitsMap.set(hour, item.sum?.visits || 0);
        }
    });

    // Build history array (30-minute intervals approximated from hourly data)
    const history = [];
    
    hourlyData.forEach((item, index) => {
        const datetime = item.dimensions?.datetime;
        const requests = item.sum?.requests || 0;
        const uniques = item.uniq?.uniques || 0;
        const visits = visitsMap.get(datetime) || Math.floor(uniques * 1.2);

        // Add entry for the hour
        history.push({
            t: datetime,
            v: uniques,
            r: requests,
            visits: visits
        });

        // Interpolate a 30-minute point if not the last entry
        if (index < hourlyData.length - 1) {
            const nextItem = hourlyData[index + 1];
            const nextUniques = nextItem.uniq?.uniques || 0;
            const nextRequests = nextItem.sum?.requests || 0;
            
            const midTime = new Date(new Date(datetime).getTime() + 30 * 60 * 1000);
            
            history.push({
                t: midTime.toISOString(),
                v: Math.round((uniques + nextUniques) / 2),
                r: Math.round((requests + nextRequests) / 2),
                visits: Math.round(visits * 0.95)
            });
        }
    });

    // Calculate current metrics
    const latestHour = hourlyData[hourlyData.length - 1] || {};
    const totalRequests = totals.sum?.requests || latestHour.sum?.requests || 0;
    const totalBytes = totals.sum?.bytes || latestHour.sum?.bytes || 0;
    const cachedBytes = totals.sum?.cachedBytes || latestHour.sum?.cachedBytes || 0;
    const currentUniques = totals.uniq?.uniques || latestHour.uniq?.uniques || 0;

    // Calculate cache hit ratio
    const cachePercent = totalBytes > 0 
        ? (cachedBytes / totalBytes) * 100 
        : 0;

    // Calculate baseline (rolling average)
    const avgVisitors = history.length > 0
        ? Math.round(history.reduce((sum, h) => sum + h.v, 0) / history.length)
        : 100;
    const avgRequests = history.length > 0
        ? Math.round(history.reduce((sum, h) => sum + h.r, 0) / history.length)
        : 2500;

    return {
        current: {
            timestamp: new Date().toISOString(),
            visitors: currentUniques,
            requests: totalRequests,
            visits: Math.round(currentUniques * 1.2),
            cachePercent: cachePercent,
            bytesServed: totalBytes
        },
        history: history.slice(-48), // Keep last 48 entries (24 hours at 30-min intervals)
        baseline: {
            avgVisitors: Math.max(avgVisitors, 10),
            avgRequests: Math.max(avgRequests, 100)
        }
    };
}

/**
 * Generate mock data when API is unavailable
 */
function generateMockData() {
    const now = new Date();
    const history = [];

    // Generate 48 data points (24 hours at 30-min intervals)
    for (let i = 47; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - (i * 30 * 60 * 1000));
        const hour = timestamp.getHours();

        // Simulate daily traffic pattern with peak around noon
        const baseVisitors = 80 + Math.sin((hour - 6) * Math.PI / 12) * 60;
        const visitors = Math.max(20, Math.floor(baseVisitors + (Math.random() - 0.5) * 40));
        const requests = Math.floor(visitors * (20 + Math.random() * 15));

        history.push({
            t: timestamp.toISOString(),
            v: visitors,
            r: requests,
            visits: Math.floor(visitors * 1.2)
        });
    }

    const latest = history[history.length - 1];

    return {
        current: {
            timestamp: new Date().toISOString(),
            visitors: latest.v,
            requests: latest.r,
            visits: latest.visits,
            cachePercent: 2 + Math.random() * 8,
            bytesServed: 4000000 + Math.random() * 4000000
        },
        history,
        baseline: {
            avgVisitors: 100,
            avgRequests: 2500
        }
    };
}
