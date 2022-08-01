port module Main exposing (..)

import Browser exposing (Document)
import Css
import Debug exposing (log)
import Dict exposing (Dict)
import Html exposing (Attribute, Html, button, div, input, li, ol, span, text)
import Html.Attributes exposing (attribute, class, placeholder, style, value)
import Html.Events exposing (on, onClick, onInput)
import Html.Events.Extra exposing (targetValueIntParse)
import Html.Lazy exposing (lazy, lazy2)
import Http
import Json.Decode as Decode
import Json.Encode as Encode
import List.Extra exposing (getAt)
import Platform.Cmd as Cmd
import Url.Builder exposing (relative)



-- MAIN


main =
    Browser.document
        { init = init
        , subscriptions = subscriptions
        , update = update
        , view = view
        }



-- MODEL


type alias KeyCandidate =
    { word : String
    , metadata : String
    , freq : List Int
    }


type alias Frequency =
    List Int


type alias Model =
    { keyword : String
    , userMessage : Dict String String
    , synonyms : List KeyCandidate
    }


defaultModel =
    { keyword = "{{ loading_placeholder }}"
    , userMessage = Dict.empty
    , synonyms = []
    }


init : () -> ( Model, Cmd Msg )
init _ =
    -- update NextWorkElement model
    ( defaultModel, Cmd.none )



-- PORTS


port sendMessage : Encode.Value -> Cmd msg


port messageReceiver : (Decode.Value -> msg) -> Sub msg



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch [ messageReceiver Recv ]


portEncoder : Model -> Encode.Value
portEncoder model =
    Encode.object
        [ ( "keyword", Encode.string model.keyword )
        ]


type alias MsgDecoded =
    { keyword : String }


portDecoder : Decode.Decoder MsgDecoded
portDecoder =
    Decode.map MsgDecoded
        (Decode.field "keyword" Decode.string)



-- UPDATE


type
    Msg
    -- synonyms
    = SelectSynonym Int
    | SortSynonymsByFreq
    | SortSynonymsByOrigin
      -- Http responses
    | SynonymsReady (Result Http.Error (List KeyCandidate))
      -- input/output?
    | KeywordInput String
      -- ports
    | Recv Decode.Value


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        KeywordInput word ->
            let
                newModel =
                    { model | keyword = word }
            in
            ( newModel, Cmd.batch [ getSynonyms newModel.keyword ] )

        SortSynonymsByFreq ->
            ( { model | synonyms = List.reverse (List.sortWith compareKeyCandidates model.synonyms) }, Cmd.none )

        SortSynonymsByOrigin ->
            ( { model | synonyms = List.reverse (List.sortBy .metadata model.synonyms) }, Cmd.none )

        SynonymsReady result ->
            case result of
                Ok syns ->
                    ( { model | synonyms = syns, userMessage = Dict.remove "SynonymsReady" model.userMessage }, Cmd.none )

                Err _ ->
                    ( { model | synonyms = [], userMessage = Dict.insert "SynonymsReady" "{{ error_getting_synonyms }}" model.userMessage }, Cmd.none )

        SelectSynonym index ->
            let
                newKeyword =
                    Maybe.withDefault { metadata = "{{ error }}", word = "{{ error }}", freq = [ 0, 0 ] } (getAt index model.synonyms)

                newModel =
                    { model | keyword = newKeyword.word }
            in
            ( newModel, Cmd.batch [ sendMessage (portEncoder newModel), getSynonyms newModel.keyword ] )

        Recv jsonValue ->
            case Decode.decodeValue portDecoder jsonValue of
                Ok value ->
                    let
                        newKeyword =
                            if String.length value.keyword > 0 then
                                value.keyword

                            else
                                model.keyword

                        newModel =
                            { model | keyword = newKeyword }
                    in
                    ( newModel, Cmd.batch [ getSynonyms newModel.keyword ] )

                Err _ ->
                    ( defaultModel, Cmd.none )


compareKeyCandidates : KeyCandidate -> KeyCandidate -> Order
compareKeyCandidates a b =
    let
        afreq =
            Maybe.withDefault 0 (getAt 0 a.freq)
                + Maybe.withDefault 0 (getAt 1 a.freq)
                + Maybe.withDefault 0 (getAt 2 a.freq)
                + Maybe.withDefault 0 (getAt 3 a.freq)

        bfreq =
            Maybe.withDefault 0 (getAt 0 b.freq)
                + Maybe.withDefault 0 (getAt 1 b.freq)
                + Maybe.withDefault 0 (getAt 2 b.freq)
                + Maybe.withDefault 0 (getAt 3 b.freq)
    in
    case compare afreq bfreq of
        LT ->
            LT

        EQ ->
            EQ

        GT ->
            GT


keyCandidateDecoder : Decode.Decoder KeyCandidate
keyCandidateDecoder =
    Decode.map3 KeyCandidate
        (Decode.field "word" Decode.string)
        (Decode.field "metadata" Decode.string)
        (Decode.field "freq" (Decode.list Decode.int))


synonymsDecoder : Decode.Decoder (List KeyCandidate)
synonymsDecoder =
    Decode.list keyCandidateDecoder


getSynonyms : String -> Cmd Msg
getSynonyms keyword =
    Http.get
        { url = relative [ "api", "synonyms/" ++ keyword ] []
        , expect = Http.expectJson SynonymsReady synonymsDecoder
        }



-- VIEW


view : Model -> Document Msg
view model =
    Document "synonyms" [ render model ]


renderUserMessages : Dict String String -> Html Msg
renderUserMessages userMessage =
    div [] [ text (String.join "!" (Dict.values userMessage)) ]


renderSingleSynonym : Int -> KeyCandidate -> Html Msg
renderSingleSynonym index synonym =
    div
        [ style "padding" "2px 0"
        , style "display" "flex"
        , class "row"
        ]
        [ span
            [ style "flex" "0 0 2rem"
            , value (String.fromInt index)
            ]
            [ text (String.fromInt index ++ ".") ]
        , span
            [ style "flex" "0 0 2rem" ]
            [ text (synonym.metadata ++ ": ") ]
        , span
            [ style "flex" "10 1 6rem" ]
            [ text synonym.word ]
        , span
            [ style "flex" "1 0 4rem" ]
            [ text (String.fromInt <| Maybe.withDefault 0 <| getAt 0 synonym.freq) ]
        , span
            [ style "flex" "1 0 4rem" ]
            [ text (String.fromInt <| Maybe.withDefault 0 <| getAt 1 synonym.freq) ]
        ]


renderSynonyms : List KeyCandidate -> Html Msg
renderSynonyms synonyms =
    let
        partial =
            lazy2 renderSingleSynonym
    in
    div
        [ on "click" (Decode.map SelectSynonym targetValueIntParse) ]
        (List.indexedMap partial synonyms)


render : Model -> Html Msg
render model =
    -- Synonyms
    div
        [ style "background-color" "rgb(190, 190, 190)"
        , style "overflow" "auto"
        ]
        [ lazy renderUserMessages model.userMessage
        , lazy2 div
            [ style "display" "flex" ]
            [ span
                [ style "flex" "10 1 calc(2rem + 2rem + 6rem)"
                , onClick SortSynonymsByOrigin
                ]
                [ text "{{ title }}" ]
            , span
                [ style "flex" "1 0 4rem"
                , onClick SortSynonymsByFreq
                ]
                [ text "{{ google_corpus_freq }}" ]
            , span
                [ style "flex" "1 0 4rem"
                , onClick SortSynonymsByFreq
                ]
                [ text "{{ subtitles_freq }}" ]
            ]
        , lazy2 div [] [ renderSynonyms model.synonyms ]
        ]
