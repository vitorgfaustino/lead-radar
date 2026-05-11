/*
 * Copyright (C) 2026 Vitor Faustino
 * Licensed under the GNU Affero General Public License v3.0.
 * This software is provided "as is", without any warranty of any kind.
 * The author disclaims liability for damages and inaccurate AI-generated or AI-assisted results,
 * to the fullest extent permitted by law.
 * See the GNU Affero General Public License for details.
 */

class PlacesService {
    constructor() {
        this.apiKey = null;
    }

    async validateApiKey() {
        try {
            const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': ApiKeyService.getApiKey(),
                    'X-Goog-FieldMask': 'places.id'
                },
                body: JSON.stringify({
                    textQuery: "test",
                    maxResultCount: 1
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Falha na validação da chave API');
            }

            return true;
        } catch (error) {
            console.error('Erro ao validar chave API:', error);
            throw error;
        }
    }

    async searchPlaces(query, location, radius, maxResults = 60, shouldFetchPhotos = false) {
        try {
            // Garantir que maxResults seja um número
            maxResults = parseInt(maxResults) || 60;
            
            // A API do Google Places pode limitar os resultados a 20 por página
            // Vamos fazer múltiplas chamadas para obter mais resultados se necessário
            let allPlaces = [];
            let pageToken = null;
            let attempts = 0;
            const MAX_ATTEMPTS = 3; // Limitar o número de chamadas para evitar excesso
            
            do {
                const requestBody = {
                    textQuery: query,
                    locationBias: {
                        circle: {
                            center: {
                                latitude: location.lat,
                                longitude: location.lng
                            },
                            radius: radius
                        }
                    },
                    maxResultCount: Math.min(maxResults, 60) // API aceita no máximo 60
                };
                
                // Adicionar pageToken se existir para paginação
                if (pageToken) {
                    requestBody.pageToken = pageToken;
                }
                
                const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': ApiKeyService.getApiKey(),
                        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.websiteUri,places.googleMapsUri,places.nationalPhoneNumber,places.photos,nextPageToken'
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || 'Erro na busca de lugares');
                }

                const data = await response.json();
                const places = data.places || [];
                
                // Adicionar resultados desta página
                allPlaces = [...allPlaces, ...places];
                
                // Verificar se há mais páginas
                pageToken = data.nextPageToken;
                attempts++;
                
                // Continuar buscando se tiver token de página, não atingimos o limite de resultados e não excedemos o número máximo de tentativas
            } while (pageToken && allPlaces.length < maxResults && attempts < MAX_ATTEMPTS);
            
            console.log(`Obtidos ${allPlaces.length} resultados no total`);
            
            // Limitar o número de resultados conforme solicitado
            const limitedPlaces = allPlaces.slice(0, maxResults);
            
            return this.processResults(limitedPlaces, shouldFetchPhotos);
        } catch (error) {
            console.error('Erro na busca:', error);
            throw error;
        }
    }

    async getPlaceDetails(placeId) {
        try {
            const response = await fetch(`https://places.googleapis.com/v1/${placeId}`, {
                method: 'GET',
                headers: {
                    'X-Goog-Api-Key': ApiKeyService.getApiKey(),
                    'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,rating,userRatingCount,websiteUri,googleMapsUri,nationalPhoneNumber,photos'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Erro ao obter detalhes do lugar');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao obter detalhes:', error);
            return {};
        }
    }

    processResults(places, shouldFetchPhotos) {
        return places.map(place => ({
            placeId: place.id,
            nome: place.displayName?.text || 'Nome não disponível',
            endereco: place.formattedAddress || 'Endereço não disponível',
            telefone: place.nationalPhoneNumber || 'Não disponível',
            website: place.websiteUri || 'Não disponível',
            googleMapsUri: place.googleMapsUri || '',
            avaliacao: place.rating ? place.rating.toFixed(1) : 'Não avaliado',
            totalAvaliacoes: place.userRatingCount ? place.userRatingCount.toLocaleString() : 'N/A',
            localizacao: {
                lat: place.location?.latitude || 0,
                lng: place.location?.longitude || 0
            },
            foto: shouldFetchPhotos && place.photos && place.photos.length > 0 
                ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?key=${ApiKeyService.getApiKey()}&maxHeightPx=400`
                : null,
            hasPhoto: place.photos && place.photos.length > 0
        }));
    }

    setApiKey(key) {
        this.apiKey = key;
    }
} 