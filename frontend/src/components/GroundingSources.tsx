import React from 'react';
import {
  SearchSuggestions,
  SearchChip,
  SearchIcon,
  GroundingContainer,
  GroundingSection,
  GroundingTitle,
  SourcesList,
  SourceItem,
  SourceLink,
} from './ChatMessage.styles'; // Assumindo que os estilos são de ChatMessage
import { GoogleSearchIcon } from './icons';

// Definindo a interface aqui, pois é específica para este componente
export interface GroundingMetadata {
  sources?: Array<{
    title: string;
    uri: string;
  }>;
  searchSuggestions?: string[];
  citations?: Array<{
    text: string;
    startIndex: number;
    endIndex: number;
    sources: number[];
    confidence: number;
  }>;
  searchEntryPoint?: {
    renderedContent: string;
  };
}

interface GroundingSourcesProps {
  groundingMetadata: GroundingMetadata;
}

const GroundingSources: React.FC<GroundingSourcesProps> = ({ groundingMetadata }) => {
  if (!groundingMetadata || (!groundingMetadata.sources && !groundingMetadata.searchSuggestions && !groundingMetadata.searchEntryPoint)) {
    return null;
  }

  const renderSearchEntryPoint = () => {
    if (groundingMetadata.searchEntryPoint?.renderedContent) {
      return (
        <div
          dangerouslySetInnerHTML={{
            __html: groundingMetadata.searchEntryPoint.renderedContent
          }}
          style={{
            marginTop: '8px',
            width: '100%',
            minWidth: '100%'
          }}
        />
      );
    }

    if (groundingMetadata.searchSuggestions && groundingMetadata.searchSuggestions.length > 0) {
      return (
        <SearchSuggestions>
          <SearchIcon>
            <GoogleSearchIcon />
          </SearchIcon>
          {groundingMetadata.searchSuggestions.map((suggestion, index) => (
            <SearchChip
              key={index}
              href={`https://www.google.com/search?q=${encodeURIComponent(suggestion)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {suggestion}
            </SearchChip>
          ))}
        </SearchSuggestions>
      );
    }
    return null;
  };

  return (
    <GroundingContainer>
      {renderSearchEntryPoint()}
      {groundingMetadata.sources && groundingMetadata.sources.length > 0 && (
        <GroundingSection>
          <GroundingTitle>Fontes:</GroundingTitle>
          <SourcesList>
            {groundingMetadata.sources.map((source, index) => (
              <SourceItem key={index}>
                <SourceLink href={source.uri} target="_blank" rel="noopener noreferrer">
                  {source.title || source.uri}
                </SourceLink>
              </SourceItem>
            ))}
          </SourcesList>
        </GroundingSection>
      )}
    </GroundingContainer>
  );
};

export default GroundingSources;