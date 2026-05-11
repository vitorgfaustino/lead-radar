/*
 * Copyright (C) 2026 Vitor Faustino
 * Licensed under the GNU Affero General Public License v3.0.
 * This software is provided "as is", without any warranty of any kind.
 * The author disclaims liability for damages and inaccurate AI-generated or AI-assisted results,
 * to the fullest extent permitted by law.
 * See the GNU Affero General Public License for details.
 */

class MapService {
    constructor() {
        this.map = null;
        this.markers = [];
        this.infoWindow = null;
        this.defaultLocation = { lat: -23.550520, lng: -46.633308 }; // São Paulo
    }

    async initializeMap() {
        try {
            // Esperar o carregamento da API do Google Maps
            await new Promise((resolve) => {
                if (window.google && window.google.maps) {
                    resolve();
                } else {
                    window.initMap = resolve;
                }
            });

            // Configurações iniciais do mapa
            this.map = new google.maps.Map(document.getElementById('map'), {
                center: this.defaultLocation,
                zoom: 12,
                styles: this.getMapStyles(),
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false
            });

            // Criar info window
            this.infoWindow = new google.maps.InfoWindow();

        } catch (error) {
            console.error('Erro ao inicializar mapa:', error);
            throw error;
        }
    }

    getMapCenter() {
        if (!this.map) return null;
        const center = this.map.getCenter();
        return {
            lat: center.lat(),
            lng: center.lng()
        };
    }

    clearMarkers() {
        this.markers.forEach(marker => {
            if (marker.map) {
                marker.map = null;
            }
        });
        this.markers = [];
        if (this.infoWindow) {
            this.infoWindow.close();
        }
    }

    addMarkers(places) {
        if (!this.map || !places) return;

        const bounds = new google.maps.LatLngBounds();

        places.forEach((place, index) => {
            if (!place.localizacao) return;

            const position = {
                lat: place.localizacao.lat,
                lng: place.localizacao.lng
            };

            // Criar marcador usando a API tradicional
            const marker = new google.maps.Marker({
                position: position,
                map: this.map,
                title: place.nome,
                label: {
                    text: `${index + 1}`,
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 'bold'
                },
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: '#9F7AEA',
                    fillOpacity: 1,
                    strokeColor: '#805AD5',
                    strokeWeight: 2,
                    scale: 12
                }
            });

            // Adicionar evento de clique
            marker.addListener('click', () => {
                this.showInfoWindow(place, marker);
            });

            this.markers.push(marker);
            bounds.extend(position);
        });

        // Ajustar o zoom para mostrar todos os marcadores
        if (this.markers.length > 0) {
            this.map.fitBounds(bounds);
            
            // Se houver apenas um marcador, dar zoom apropriado
            if (this.markers.length === 1) {
                this.map.setZoom(15);
            }
        }
    }

    escapeHtml(value) {
        if (value == null) return '';

        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    safeExternalUrl(value) {
        if (!value || value === 'Não disponível') return '';

        const normalizedValue = /^https?:\/\//i.test(value)
            ? value
            : `https://${value}`;

        try {
            const parsedUrl = new URL(normalizedValue);
            return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
                ? parsedUrl.href
                : '';
        } catch {
            return '';
        }
    }

    safeTelephoneHref(value) {
        if (!value || value === 'Não disponível') return '';

        const normalizedPhone = String(value).replace(/[^\d+]/g, '');
        return normalizedPhone ? `tel:${normalizedPhone}` : '';
    }

    showInfoWindow(place, marker) {
        if (!this.infoWindow || !this.map) return;

        const safeName = this.escapeHtml(place.nome || 'Empresa sem nome');
        const safeAddress = this.escapeHtml(place.endereco || 'Não disponível');
        const safeRating = this.escapeHtml(place.avaliacao || 'Não avaliado');
        const safeReviewCount = this.escapeHtml(place.totalAvaliacoes || 0);
        const safeTelephoneDisplay = this.escapeHtml(place.telefone || '');
        const telephoneHref = this.safeTelephoneHref(place.telefone || '');
        const websiteHref = this.safeExternalUrl(place.website || '');

        // Estilo simples para o balão de informações
        const infoWindowStyle = `
            <style>
                /* Corrige o espaço em branco no topo */
                .gm-style .gm-style-iw-c {
                    padding: 12px !important;
                }
                
                /* Permite rolagem se necessário */
                .gm-style .gm-style-iw-d {
                    overflow-y: auto !important;
                    max-height: 300px !important;
                }
                
                /* Container principal */
                .info-window {
                    font-family: Arial, sans-serif;
                    color: #000000;
                    max-width: 250px;
                }
                
                /* Título */
                .info-window-title {
                    font-size: 16px;
                    font-weight: 600;
                    margin: 0 0 10px 0;
                    color: #000000;
                }
                
                /* Informações */
                .info-window-info {
                    margin-bottom: 8px;
                    font-size: 14px;
                }
                
                /* Avaliação */
                .info-window-rating {
                    margin-bottom: 8px;
                }
                
                .rating-value {
                    font-weight: bold;
                }
                
                /* Links */
                .info-window-links {
                    margin-top: 10px;
                }
                
                .info-window-link {
                    color: #0066cc;
                    text-decoration: none;
                    margin-right: 15px;
                    display: inline-block;
                }
                
                .info-window-link:hover {
                    text-decoration: underline;
                }
            </style>
        `;

        const content = `
            ${infoWindowStyle}
            <div class="info-window">
                <h3 class="info-window-title">${safeName}</h3>
                
                <div class="info-window-info">
                    <strong>Endereço:</strong> ${safeAddress}
                </div>
                
                ${place.avaliacao !== 'Não avaliado' ? `
                    <div class="info-window-rating">
                        <strong>Avaliação:</strong> <span class="rating-value">${safeRating}</span> (${safeReviewCount} avaliações)
                    </div>
                ` : ''}
                
                <div class="info-window-links">
                    ${telephoneHref ? `
                        <a href="${telephoneHref}" class="info-window-link" title="Ligar para ${safeName}">
                            <i class="fas fa-phone-alt"></i> Ligar
                        </a>
                        <span class="info-window-info">${safeTelephoneDisplay}</span>
                    ` : ''}
                    
                    ${websiteHref ? `
                        <a href="${websiteHref}" target="_blank" rel="noopener noreferrer" class="info-window-link" title="Visitar website de ${safeName}">
                            <i class="fas fa-globe"></i> Website
                        </a>
                    ` : ''}
                </div>
            </div>
        `;

        this.infoWindow.setContent(content);
        this.infoWindow.open(this.map, marker);
    }

    getMapStyles() {
        return [
            {
                "featureType": "all",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#ffffff"}]
            },
            {
                "featureType": "all",
                "elementType": "labels.text.stroke",
                "stylers": [{"visibility": "on"}, {"color": "#3e606f"}, {"weight": 2}, {"gamma": 0.84}]
            },
            {
                "featureType": "all",
                "elementType": "labels.icon",
                "stylers": [{"visibility": "off"}]
            },
            {
                "featureType": "administrative",
                "elementType": "geometry",
                "stylers": [{"weight": 0.6}, {"color": "#1F2937"}]
            },
            {
                "featureType": "landscape",
                "elementType": "geometry",
                "stylers": [{"color": "#1F2937"}]
            },
            {
                "featureType": "poi",
                "elementType": "geometry",
                "stylers": [{"color": "#406d80"}]
            },
            {
                "featureType": "poi.park",
                "elementType": "geometry",
                "stylers": [{"color": "#2c5a71"}]
            },
            {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [{"color": "#29768a"}, {"lightness": -37}]
            },
            {
                "featureType": "transit",
                "elementType": "geometry",
                "stylers": [{"color": "#406d80"}]
            },
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{"color": "#193341"}]
            }
        ];
    }

    addMarker(position, title = '', isCenter = false) {
        if (!this.map) return;

        const marker = new google.maps.Marker({
            position: position,
            map: this.map,
            title: title,
            icon: isCenter ? {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#EF4444',
                fillOpacity: 1,
                strokeColor: '#DC2626',
                strokeWeight: 2,
                scale: 10
            } : null
        });

        this.markers.push(marker);
        return marker;
    }
} 