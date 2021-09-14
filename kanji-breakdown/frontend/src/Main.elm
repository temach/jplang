module Main exposing (..)

import Browser exposing (Document)
import Css
import Debug exposing (log)
import Dict exposing (Dict)
import Html exposing (Attribute, Html, button, div, input, li, ol, span, text)
import Html.Attributes exposing (attribute, placeholder, style, value)
import Html.Events exposing (on, onClick, onInput)
import Html.Events.Extra exposing (targetValueIntParse)
import Http
import Json.Decode as Decode
import Json.Encode as Encode
import Platform.Cmd as Cmd
import Url.Builder exposing (absolute)



-- MAIN


main =
    Browser.document
        { init = init
        , subscriptions = subscriptions
        , update = update
        , view = view
        }



-- MODEL


type alias WorkElement =
    { kanji : String
    , keyword : String
    , notes : String
    , svg : String
    , parts : List String
    }


type alias KeyCandidate =
    { word : String
    , metadata : String
    , freq : List Int
    }


type alias Model =
    { currentWork : WorkElement
    , kanji : String
    , keyword : String
    , notes : String
    , freq : List Int
    , workElements : List WorkElement
    , suggestions : List KeyCandidate
    , currentWorkIndex : Int
    , currentHighlightWorkElementIndex : Int
    , userMessage : Dict String String
    }


init : () -> ( Model, Cmd Msg )
init _ =
    let
        model =
            { currentWork = { kanji = "", keyword = "", notes = "", svg = "", parts = [] }
            , kanji = ""
            , keyword = "loading..."
            , notes = ""
            , svg = ""
            , parts = []

            , workElements = [ WorkElement "a" "first" "" "" [], WorkElement "b" "second" "asd" "" "" [], WorkElement "c" "third" "" "" "" [] ]
            , workElements = []
            , currentWorkIndex = -1
            , currentHighlightWorkElementIndex = -1
            , userMessage = Dict.empty
            }
    in
    -- update NextWorkElement model
    -- ( model, getWorkElements )
    ( model )



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none



-- UPDATE


type
    Msg
    -- work elements
    = NextWorkElement
    | SelectWorkElement Int
    | HighlightWorkElement Int
    | UnHighlightWorkElement Int
      -- inputs
    | KeywordInput String
    | NotesInput String
    | KeywordSubmitClick
      -- Http responses
    | KeywordSubmitReady (Result Http.Error String)
    | WorkElementsReady (Result Http.Error (List WorkElement))
    | KeywordCheckReady (Result Http.Error KeyCandidate)


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        KeywordSubmitClick ->
            if String.length model.keyword > 0 then
                ( model, submitKeyword model )

            else
                ( { model | userMessage = Dict.insert "KeywordSubmitClick" "Error: keyword length must be non-zero" model.userMessage }, Cmd.none )

        KeywordSubmitReady result ->
            case result of
                Ok body ->
                    let
                        newElement =
                            { kanji = model.kanji
                            , keyword = model.keyword
                            , notes = model.notes
                            }

                        newWork =
                            updateWorkElement model.currentWorkIndex newElement model.workElements

                        newModel =
                            { model | workElements = newWork }
                    in
                    if String.length body > 0 then
                        ( { model | userMessage = Dict.insert "KeywordSubmitReady" ("Error submitting keyword. Details:" ++ body) model.userMessage }, Cmd.none )

                    else
                        update NextWorkElement { newModel | userMessage = Dict.empty }

                Err _ ->
                    ( { model | userMessage = Dict.insert "KeywordSubmitReady" "Error submitting keyword. Details unknown." model.userMessage }, Cmd.none )

        NextWorkElement ->
            update (SelectWorkElement (model.currentWorkIndex + 1)) model

        SelectWorkElement index ->
            let
                fixWorkModel =
                    chooseWorkElement index model

                newModel =
                    { fixWorkModel | freq = [], userMessage = Dict.empty }

                keywordPresentCommands =
                    Cmd.batch
                        [ getSuggestions newModel.kanji
                        , getExpressions newModel.kanji
                        , getKeywordCheck newModel.kanji newModel.keyword
                        , getSynonyms newModel.keyword
                        ]

                keywordAbsentCommands =
                    Cmd.batch
                        [ getSuggestions newModel.kanji
                        , getExpressions newModel.kanji
                        ]
            in
            if String.length newModel.keyword >= 2 then
                ( newModel, keywordPresentCommands )

            else
                ( newModel, keywordAbsentCommands )

        HighlightWorkElement index ->
            ( { model | currentHighlightWorkElementIndex = index }, Cmd.none )

        UnHighlightWorkElement index ->
            if model.currentHighlightWorkElementIndex == index then
                ( { model | currentHighlightWorkElementIndex = -1 }, Cmd.none )

            else
                ( model, Cmd.none )

        KeywordInput word ->
            let
                newModel =
                    { model
                        | keyword = word
                    }
            in
            if String.length word >= 2 then
                ( newModel, Cmd.batch [ getKeywordCheck newModel.kanji word, getSynonyms newModel.keyword ] )

            else
                ( { newModel | freq = [], userMessage = Dict.empty }, Cmd.none )

        NotesInput word ->
            ( { model | notes = word }, Cmd.none )

        WorkElementsReady result ->
            case result of
                Ok elements ->
                    let
                        newModel =
                            { model | workElements = elements, userMessage = Dict.remove "WorkElementsReady" model.userMessage }
                    in
                    update NextWorkElement newModel

                Err _ ->
                    ( { model | userMessage = Dict.insert "WorkElementsReady" "Error getting workElements" model.userMessage }, Cmd.none )

        KeywordCheckReady result ->
            case result of
                Ok elem ->
                    ( { model | freq = elem.freq, userMessage = Dict.insert "KeywordCheckReady" elem.metadata model.userMessage }, Cmd.none )

                Err _ ->
                    ( { model | freq = [], userMessage = Dict.insert "KeywordCheckReady" "Error getting keyword frequency" model.userMessage }, Cmd.none )


chooseWorkElement : Int -> Model -> Model
chooseWorkElement index model =
    let
        selected =
            Maybe.withDefault (WorkElement "X" "Error" "An error occurred") (get index model.workElements)
    in
    { model
        | currentWorkIndex = index
        , kanji = selected.kanji
        , keyword = selected.keyword
        , notes = selected.notes
    }


updateWorkElement : Int -> WorkElement -> List WorkElement -> List WorkElement
updateWorkElement index newElement list =
    let
        updator i elem =
            if i == index then
                newElement

            else
                elem
    in
    List.indexedMap updator list


get : Int -> List a -> Maybe a
get index list =
    List.head (List.drop index list)


getWorkElements : Cmd Msg
getWorkElements =
    Http.get
        { url = absolute [ "api", "work" ] []
        , expect = Http.expectJson WorkElementsReady workElementsDecoder
        }


workElementsDecoder : Decode.Decoder (List WorkElement)
workElementsDecoder =
    Decode.list
        (Decode.map4 WorkElement
            (Decode.index 0 Decode.string)
            (Decode.index 1 Decode.string)
            (Decode.index 2 Decode.string)
            (Decode.index 3 Decode.list)
        )


getKeywordCheck : String -> String -> Cmd Msg
getKeywordCheck kanji keyword =
    Http.get
        { url = absolute [ "api", "keywordcheck/" ++ kanji ++ "/" ++ keyword ] []
        , expect = Http.expectJson KeywordCheckReady keyCandidateDecoder
        }


keyCandidateDecoder : Decode.Decoder KeyCandidate
keyCandidateDecoder =
    Decode.map3 KeyCandidate
        (Decode.field "word" Decode.string)
        (Decode.field "metadata" Decode.string)
        (Decode.field "freq" (Decode.list Decode.int))


submitKeyword : Model -> Cmd Msg
submitKeyword model =
    Http.post
        { url = absolute [ "api", "submit" ] []
        , body = Http.jsonBody (submitKeywordEncoder model)
        , expect = Http.expectString KeywordSubmitReady
        }


submitKeywordEncoder : Model -> Encode.Value
submitKeywordEncoder model =
    Encode.object
        [ ( "kanji", Encode.string model.kanji )
        , ( "keyword", Encode.string model.keyword )
        , ( "notes", Encode.string model.notes )
        ]



-- VIEW


view : Model -> Document Msg
view model =
    Document "Kanji" [ render model ]


renderSingleWorkElement : Model -> Int -> WorkElement -> Html Msg
renderSingleWorkElement model index elem =
    div
        [ style "padding" "2px 0"
        , style "display" "flex"
        ]
        [ span
            [ style "flex" "0 0 1.5rem"
            , value (String.fromInt index)
            , on "mouseenter" (Decode.map HighlightWorkElement targetValueIntParse)
            , on "mouseleave" (Decode.map UnHighlightWorkElement targetValueIntParse)
            , if model.currentHighlightWorkElementIndex == index then
                style "background-color" "rgb(250, 250, 250)"

              else
                style "background-color" ""
            ]
            [ text (String.fromInt index ++ ".") ]
        , span
            [ style "flex" "0 0 auto"
            , style "margin" "0 0.5rem"
            , style "background-color" "rgb(210, 200, 200)"
            ]
            [ text elem.kanji ]
        , span
            [ style "flex" "1 0 4rem"
            , style "margin" "0 0.5rem"
            , if String.length elem.keyword > 0 then
                style "background-color" "rgb(200, 210, 200)"

              else
                style "background-color" ""
            ]
            [ text elem.keyword ]
        , span
            [ style "flex" "10 1 auto"
            , if String.length elem.notes > 0 then
                style "background-color" "rgb(200, 200, 210)"

              else
                style "background-color" ""
            ]
            [ text elem.notes ]
        ]


renderWorkElements : Model -> Html Msg
renderWorkElements model =
    let
        partial =
            renderSingleWorkElement model
    in
    div
        [ on "click" (Decode.map SelectWorkElement targetValueIntParse)
        ]
        (List.indexedMap partial model.workElements)


renderUserMessages : Model -> Html Msg
renderUserMessages model =
    div [] [ text (String.join "!" (Dict.values model.userMessage)) ]


renderSubmitBar : Model -> Html Msg
renderSubmitBar model =
    div [ style "display" "flex" ]
        [ span
            [ style "flex" "1 0 auto" ]
            [ text model.kanji ]
        , span
            [ style "flex" "10 0 70px" ]
            [ input
                [ placeholder "Keyword"
                , value model.keyword
                , onInput KeywordInput
                , style "width" "100%"
                , style "box-sizing" "border-box"
                ]
                []
            ]
        , span
            [ style "flex" "1 0 auto" ]
            [ button [ onClick KeywordSubmitClick ] [ text "Submit" ] ]
        , span
            [ style "flex" "10 0 70px" ]
            [ input
                [ placeholder "Notes"
                , value model.notes
                , onInput NotesInput
                , style "width" "100%"
                , style "box-sizing" "border-box"
                ]
                []
            ]
        ]


render : Model -> Html Msg
render model =
    -- central css grid container
    div
        [ style "display" "grid"
        , style "grid-template-columns" "1px 2fr 1fr 2fr 1px"
        , style "grid-template-rows" "8vh 30vh 30vh 32vh"
        ]
        [ -- Keyword submit
          div
            [ style "background-color" "rgb(250, 250, 250)"
            , style "grid-column" "2 / 5"
            , style "grid-row" "1 / 2"
            , style "overflow" "auto"
            ]
            [ renderUserMessages model
            , renderSubmitBar model
            ]

        -- WorkElement select
        , div
            [ style "background-color" "rgb(210, 210, 210)"
            , style "grid-column" "4 / 5"
            , style "grid-row" "2 / 4"
            , style "overflow" "auto"
            ]
            [ div [] [ text "Work Elements Progress" ]
            , renderWorkElements model
            ]
        ]
